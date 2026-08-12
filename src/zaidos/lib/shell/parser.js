export const EMPTY_COMMAND = { command: null, args: [] };

export function parse(input) {
  const tokens = [];
  let token = "";
  let inToken = false;
  let quote = null;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

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
        token += ch;
        inToken = true;
        continue;
      }
      token += ch;
      inToken = true;
      continue;
    }

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

  if (escaped) {
    token += "\\";
    inToken = true;
  }
  if (inToken || quote !== null) tokens.push(token);

  if (tokens.length === 0) return EMPTY_COMMAND;
  return { command: tokens[0], args: tokens.slice(1) };
}
