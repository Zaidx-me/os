/**
 * Raw markdown bodies for the 4 published articles, keyed by article slug.
 *
 * Loaded at build time with import.meta.glob (query '?raw' — the documented
 * Turbopack/Vite form; the deprecated `as` option is not used). This is the
 * SINGLE content module shared by the Articles window (todo 23) and the SSR
 * routes /articles + /articles/[slug] (todo 34) — content is never duplicated.
 */
const bodies = import.meta.glob("./articles/*.md", {
  query: "?raw",
  eager: true,
  import: "default",
}) as Record<string, string>;

/** './articles/building-whatsapp-gateway.md' -> 'building-whatsapp-gateway' */
function slugFromPath(path: string): string {
  const match = /articles\/(.+)\.md$/.exec(path);
  return match ? match[1] : path;
}

/** Slug -> raw markdown body for every article with a body file. */
export const articleBodies: Record<string, string> = Object.fromEntries(
  Object.entries(bodies).map(([path, body]) => [slugFromPath(path), body]),
);

/** Raw markdown body for a slug; "" when the file is missing or unreadable. */
export function getArticleBody(slug: string): string {
  return articleBodies[slug] ?? "";
}
