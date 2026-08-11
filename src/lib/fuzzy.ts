/**
 * Launcher fuzzy search — a tiny subsequence scorer (no dependency).
 *
 * A query matches when every query character appears in order in the target
 * (case-insensitive). Higher score = better match; -1 means no match. Scoring
 * rewards: consecutive runs, word-boundary hits (start / after space, -, /),
 * and earlier positions. The exact weights only need to ORDER results
 * sensibly for a rofi-style launcher — correctness (order of magnitude, not
 * tuning) is locked by fuzzy.test.ts.
 */
export function scoreFuzzy(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (q === "") return 1;
  if (q.length > t.length) return -1;

  let score = 0;
  let ti = 0;
  let consecutive = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    if (found === ti) {
      consecutive += 1;
      score += 10 + consecutive * 5;
    } else {
      consecutive = 0;
      score += 5;
    }
    const prev = t[found - 1];
    if (found === 0 || prev === " " || prev === "-" || prev === "/") {
      score += 3;
    }
    score -= found / 100;
    ti = found + 1;
  }
  return score;
}

/** Sorts scored entries best-first (stable for equal scores). */
export function sortByScore<T>(entries: T[], score: (entry: T) => number): T[] {
  return [...entries].sort((a, b) => score(b) - score(a));
}
