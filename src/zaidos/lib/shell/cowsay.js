import { randomFortune } from "./fortune.js";

export function cowsay(message) {
  const text = message ?? randomFortune();
  const maxWidth = 40;
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  const innerWidth = Math.max(...lines.map((l) => l.length), 1);
  const border = ` ${"─".repeat(innerWidth + 2)} `;
  const top = ` ${"─".repeat(innerWidth + 2)} `;
  const body = lines.map((l) => `< ${l.padEnd(innerWidth)} >`);
  return [
    top,
    ...body,
    border,
    "        \\   ^__^",
    "         \\  (oo)\\_______",
    "            (__)\\       )\\/\\",
    "                ||----w |",
    "                ||     ||",
  ];
}
