/**
 * Shell command tokenizer — zsh-flavored word splitting without exec.
 *
 * Splits an input line into a command name + arguments, honoring:
 *   - single quotes  : everything literal until the closing quote
 *   - double quotes  : literal except \" \\ \$ escapes
 *   - backslash      : escapes the next character (outside quotes)
 *   - adjacent quote segments concatenate (echo a""b -> "ab")
 *   - empty quotes produce an empty argument (echo "" -> [""])
 *
 * Lenient by design: an unterminated quote swallows the rest of the line
 * (real shells would wait for continuation — this one is simulated, so it
 * never blocks on input).
 */
export interface ParsedCommand {
  /** First token; null when the input is empty or whitespace-only. */
  command: string | null;
  /** Remaining tokens, quote/escape-processed. */
  args: string[];
}

export const EMPTY_COMMAND: ParsedCommand = { command: null, args: [] };

export function parse(input: string): ParsedCommand {
  const tokens: string[] = [];
  let token = "";
  let inToken = false;
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;

    if (escaped) {
      token += ch;
      escaped = false;
      inToken = true;
      continue;
    }

    if (quote === "'") {
      if (ch === "'") quote = null;
      else token += ch;
      inToken = true;
      continue;
    }

    if (quote === '"') {
      if (ch === '"') {
        quote = null;
        inToken = true;
        continue;
      }
      if (ch === "\\") {
        const next = input[i + 1];
        if (next === '"' || next === "\\" || next === "$") {
          escaped = true;
          continue;
        }
        token += ch; // backslash before an ordinary char stays literal
        inToken = true;
        continue;
      }
      token += ch;
      inToken = true;
      continue;
    }

    // Unquoted.
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      inToken = true;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (inToken) {
        tokens.push(token);
        token = "";
        inToken = false;
      }
      continue;
    }
    token += ch;
    inToken = true;
  }

  // Trailing backslash at end of input — keep it literal (lenient).
  if (escaped) {
    token += "\\";
    inToken = true;
  }
  // An unterminated quote still contributes its content.
  if (inToken || quote !== null) tokens.push(token);

  if (tokens.length === 0) return EMPTY_COMMAND;
  return { command: tokens[0]!, args: tokens.slice(1) };
}
