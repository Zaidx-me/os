const SLOP_PREFIX =
  /^(?:great question|good question|absolutely|certainly|of course|sure thing|sure!|i'd be happy to|i would be happy to|feel free to|don't hesitate to|hope this helps|let me know if|happy to help|thanks for asking|that's a great|what a great)[!.]?\s*/i;

const SLOP_INLINE =
  /\b(as an ai|as a language model|i don't have personal experiences|i cannot browse the web)\b[^.!?]*[.!?]?\s*/gi;

/** Strip markdown artifacts and filler from LLM output for iMessage-style plain text. */
export function formatChatResponse(raw) {
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
