const SLOP_PREFIX =
  /^(?:great question|good question|absolutely|certainly|of course|sure thing|sure!|i'd be happy to|i would be happy to|feel free to|don't hesitate to|hope this helps|let me know if|happy to help|thanks for asking|that's a great|what a great)[!.]?\s*/i;

const SLOP_INLINE =
  /\b(as an ai|as a language model|i don't have personal experiences|i cannot browse the web)\b[^.!?]*[.!?]?\s*/gi;

const THINKING_BLOCK_RE =
  /<\s*(?:think|thinking|reasoning|thought|internal)(?:\s[^>]*)?>([\s\S]*?)<\s*\/\s*(?:think|thinking|reasoning|thought|internal)\s*>/gi;

const THINKING_BRACKET_RE =
  /\[\s*(?:thinking|reasoning|thought)\s*\]([\s\S]*?)\[\s*\/\s*(?:thinking|reasoning|thought)\s*\]/gi;

const ANSWER_SPLIT_RE = /(?:^|\n\n)(?:#{1,3}\s*)?(?:final answer|answer|response)\s*:\s*/i;

const THINKING_PREAMBLE_RE =
  /^(?:here(?:'s| is) a thinking process|thinking process|my (?:thinking|reasoning)|let me think(?: through this)?|internal (?:notes|reasoning)|analysis)[:\s]*\n?/i;

const META_REASONING_LINE_RE =
  /^(?:•\s*)?(?:analyze user input|check constraints?|the instruction says|wait,|let me re-read|i need to limit|since the user|i'll give|or i can|but the rule says|don't invent|keep answers short|plain text only|no markdown|no filler|no ai disclaimers|up to \d+ bullet|1-3 sentences|re-read carefully|they might want|user said|output rules|mandatory|this means either|i should pick|for the user asked|formulate response|review featured|identify constraints|that's \d+ projects|i can list|i'll use|but wait|the rule says|i need to make sure|key constraints)/i;

const META_REASONING_BODY_RE =
  /\b(?:analyze user input|check constraints?|the instruction says|let me re-read carefully|keep answers short|plain text only|never include reasoning|thinking process|output rules \(mandatory\)|that's \d+ projects|i can list them|i'll use bullet|but wait:|the rule says|formulate response)\b/i;

const PLANNING_PARAGRAPH_RE =
  /^(?:that's \d+ projects|i can list|i'll use|but wait|the rule says|i need to make sure|formulate response|since there are exactly)/i;

function cleanChatText(raw) {
  if (!raw || typeof raw !== "string") return "";

  let text = raw.replace(/\r\n/g, "\n").trim();

  text = text.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/^```[^\n]*\n?/gm, "").replace(/```/g, "").trim(),
  );
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/^[\s]*[-*_─—]{3,}[\s]*$/gm, "");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*\n]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_\n]+)_/g, "$1");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  text = text.replace(/\\([\\*_`[\]()#+\-.!>|])/g, "$1");
  text = text.replace(/\\/g, "");
  text = text.replace(/^[\s]*[-*+]\s+/gm, "• ");
  text = text.replace(/^[\s]*\d+\.\s+/gm, "• ");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  let prev;
  do {
    prev = text;
    text = text.replace(SLOP_PREFIX, "");
    text = text.replace(SLOP_INLINE, "");
  } while (text !== prev && text.length > 0);

  return text.trim();
}

function isMetaReasoning(text) {
  if (!text?.trim()) return false;
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return false;
  const metaCount = lines.filter((line) => META_REASONING_LINE_RE.test(line.trim())).length;
  return metaCount >= 2 || (metaCount >= 1 && lines.length <= 5);
}

function looksLikeLeakedThinking(text) {
  if (!text?.trim()) return true;
  if (THINKING_PREAMBLE_RE.test(text)) return true;
  if (isMetaReasoning(text)) return true;
  return META_REASONING_BODY_RE.test(text.slice(0, 400));
}

function findAnswerStart(paragraphs) {
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph) continue;
    if (isMetaReasoning(paragraph) || META_REASONING_BODY_RE.test(paragraph)) continue;
    if (PLANNING_PARAGRAPH_RE.test(paragraph)) continue;
    if (/^(?:i'll|i will|so i|maybe|perhaps)\s/i.test(paragraph)) continue;
    return i;
  }
  return -1;
}

function extractTaggedThinking(text) {
  const parts = [];
  let rest = text;

  for (const re of [THINKING_BLOCK_RE, THINKING_BRACKET_RE]) {
    rest = rest.replace(re, (_, inner) => {
      if (inner?.trim()) parts.push(inner.trim());
      return "";
    });
  }

  const afterClose = rest.match(/^([\s\S]*?)<\/\s*think\s*>\s*([\s\S]+)$/i);
  if (afterClose) {
    if (afterClose[1].trim()) parts.push(afterClose[1].trim());
    rest = afterClose[2].trim();
  }

  return { rest: rest.trim(), parts };
}

function extractPlainThinking(text) {
  const parts = [];
  let rest = text.trim();

  if (THINKING_PREAMBLE_RE.test(rest)) {
    rest = rest.replace(THINKING_PREAMBLE_RE, "").trim();
  }

  const splitIdx = rest.search(ANSWER_SPLIT_RE);
  if (splitIdx >= 0) {
    const before = rest.slice(0, splitIdx).trim();
    const after = rest.slice(splitIdx).replace(ANSWER_SPLIT_RE, "").trim();
    if (before) parts.push(before);
    rest = after;
    return { rest, parts };
  }

  const paragraphs = rest.split(/\n\n+/);
  const answerStart = findAnswerStart(paragraphs);

  if (answerStart > 0) {
    parts.push(paragraphs.slice(0, answerStart).join("\n\n").trim());
    rest = paragraphs.slice(answerStart).join("\n\n").trim();
  } else if (answerStart === -1 && (isMetaReasoning(rest) || META_REASONING_BODY_RE.test(rest))) {
    parts.push(rest);
    rest = "";
  }

  return { rest, parts };
}

/** Split reasoning from the visitor-facing answer. */
export function parseChatResponse(raw, extraThinking = null) {
  const thinkingParts = [];
  if (extraThinking && String(extraThinking).trim()) {
    thinkingParts.push(String(extraThinking).trim());
  }

  if (!raw || typeof raw !== "string") {
    return {
      content: "",
      thinking: cleanChatText(thinkingParts.join("\n\n")),
    };
  }

  let text = raw.replace(/\r\n/g, "\n").trim();
  const tagged = extractTaggedThinking(text);
  text = tagged.rest;
  thinkingParts.push(...tagged.parts);

  const plain = extractPlainThinking(text);
  text = plain.rest;
  thinkingParts.push(...plain.parts);

  if (looksLikeLeakedThinking(text)) {
    thinkingParts.push(text);
    text = "";
  }

  return {
    content: cleanChatText(text),
    thinking: cleanChatText(thinkingParts.filter(Boolean).join("\n\n")),
  };
}

/** True when visible text is still model planning, not a visitor-facing answer. */
export function isLeakedThinking(text) {
  return looksLikeLeakedThinking(text);
}

/** Strip markdown artifacts and filler from chat replies for iMessage-style plain text. */
export function formatChatResponse(raw) {
  return parseChatResponse(raw).content;
}

/**
 * Resolve a visitor-facing answer from standard and reasoning-model payloads.
 * Reasoning models (e.g. Nemotron) often leave message.content empty and put
 * the trace in reasoning_content — or over-filtering strips the whole reply.
 */
export function resolveLlmReply(raw, apiThinking) {
  const parsed = parseChatResponse(raw, apiThinking);
  let content = parsed.content?.trim() ?? "";
  let thinking = parsed.thinking?.trim() ?? "";

  if (content) {
    return { content, thinking };
  }

  if (raw?.trim()) {
    const fromRaw = parseChatResponse(raw);
    if (fromRaw.content?.trim()) {
      return {
        content: fromRaw.content.trim(),
        thinking: [thinking, fromRaw.thinking].filter(Boolean).join("\n\n"),
      };
    }
  }

  const reasoningText = apiThinking?.trim() ? String(apiThinking).trim() : "";
  if (reasoningText) {
    const fromReasoning = parseChatResponse(reasoningText);
    if (fromReasoning.content?.trim()) {
      return {
        content: fromReasoning.content.trim(),
        thinking: [thinking, fromReasoning.thinking].filter(Boolean).join("\n\n"),
      };
    }

    const paragraphs = reasoningText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const candidate = cleanChatText(paragraphs[i]);
      if (candidate.length >= 12 && !looksLikeLeakedThinking(candidate)) {
        return {
          content: candidate,
          thinking: [thinking, ...paragraphs.slice(0, i)].filter(Boolean).join("\n\n"),
        };
      }
    }
  }

  if (raw?.trim()) {
    const simplified = cleanChatText(raw);
    if (simplified.length >= 12 && !simplified.includes("Output rules (mandatory)")) {
      return { content: simplified, thinking };
    }
  }

  return { content: "", thinking };
}
