/**
 * Raw markdown bodies for the 4 published articles, keyed by article slug.
 *
 * Explicit imports (not import.meta.glob) so webpack dev (`next dev --webpack`)
 * stays quiet on NTFS drives. Vitest resolves `?raw` natively; webpack uses the
 * resourceQuery rule in next.config.ts.
 *
 * SINGLE content module shared by the Articles window and /articles/[slug] SSR.
 */
import aiJobApplicationAssistant from "./articles/ai-job-application-assistant.md?raw";
import buildingOfflineUrduReader from "./articles/building-offline-urdu-reader.md?raw";
import buildingWhatsappGateway from "./articles/building-whatsapp-gateway.md?raw";
import designingUniversityCourseware from "./articles/designing-university-courseware-platform.md?raw";

const bodies: Record<string, string> = {
  "ai-job-application-assistant": aiJobApplicationAssistant,
  "building-offline-urdu-reader": buildingOfflineUrduReader,
  "building-whatsapp-gateway": buildingWhatsappGateway,
  "designing-university-courseware-platform": designingUniversityCourseware,
};

/** Frontmatter fields stored in each article markdown file. */
export interface ArticleFrontmatter {
  title?: string;
  description?: string;
  date?: string;
  readingTime?: string;
  tags?: string[];
}

/** Parses a simple YAML frontmatter block (--- ... ---) from raw markdown. */
function parseFrontmatter(raw: string): {
  frontmatter: ArticleFrontmatter;
  body: string;
} {
  if (!raw.startsWith("---")) {
    return { frontmatter: {}, body: raw };
  }

  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const frontmatter: ArticleFrontmatter = {};
  let currentKey: keyof ArticleFrontmatter | null = null;
  const tagItems: string[] = [];

  for (const line of match[1].split("\n")) {
    const listItem = /^\s*-\s+(.+)$/.exec(line);
    if (listItem && currentKey === "tags") {
      tagItems.push(listItem[1].trim());
      continue;
    }

    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;

    currentKey = kv[1] as keyof ArticleFrontmatter;
    const value = kv[2].trim();

    if (currentKey === "tags") {
      if (value) {
        frontmatter.tags = value
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((t) => t.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      }
      continue;
    }

    if (value) {
      frontmatter[currentKey] = value.replace(/^["']|["']$/g, "") as never;
    }
  }

  if (tagItems.length > 0) {
    frontmatter.tags = tagItems;
  }

  return { frontmatter, body: match[2] };
}

const parsedBySlug = Object.fromEntries(
  Object.entries(bodies).map(([slug, raw]) => {
    const { frontmatter, body } = parseFrontmatter(raw);
    return [slug, { frontmatter, body }];
  }),
);

/** Slug -> parsed frontmatter for every article with a body file. */
export const articleFrontmatter: Record<string, ArticleFrontmatter> =
  Object.fromEntries(
    Object.entries(parsedBySlug).map(([slug, { frontmatter }]) => [
      slug,
      frontmatter,
    ]),
  );

/** Slug -> markdown body (frontmatter stripped) for every article file. */
export const articleBodies: Record<string, string> = Object.fromEntries(
  Object.entries(parsedBySlug).map(([slug, { body }]) => [slug, body]),
);

/** Raw markdown body for a slug; "" when the file is missing or unreadable. */
export function getArticleBody(slug: string): string {
  return articleBodies[slug] ?? "";
}

/** Frontmatter for a slug; {} when the file is missing or has no frontmatter. */
export function getArticleFrontmatter(slug: string): ArticleFrontmatter {
  return articleFrontmatter[slug] ?? {};
}
