"use client";

import { useState } from "react";
import { ArticleMarkdown } from "@/components/content/ArticleMarkdown";
import { Icon } from "@/components/ui/Icon";
import { articles } from "@/content";
import { getArticleBody } from "@/content/article-bodies";
import type { Article } from "@/content";

/**
 * Articles (articles) — list of the 4 published articles (content/articles.ts)
 * with an inline markdown reader. Bodies render from src/content/articles/*.md
 * via the shared loader (src/content/article-bodies.ts) — the SAME module the
 * /articles/[slug] SSR route (todo 34) reads, so content is never duplicated.
 *
 * QA failure: a missing/empty body file shows "Article body coming soon"
 * instead of crashing the reader.
 */

export function ArticlesApp() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = openSlug ? articles.find((a) => a.slug === openSlug) : undefined;

  return (
    <div
      data-testid="app-content-articles"
      className="h-full w-full overflow-y-auto bg-zaid-surface"
    >
      {open ? (
        <ArticleReader article={open} onBack={() => setOpenSlug(null)} />
      ) : (
        <div className="flex flex-col gap-6 p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-zaid-muted">
            <Icon name="book-open" size={14} />
            Articles
          </h2>
          <ul className="flex flex-col gap-3">
            {articles.map((article) => (
              <li
                key={article.slug}
                data-testid={`article-item-${article.slug}`}
                className="hairline flex flex-col gap-1 rounded-lg bg-zaid-surface2 p-4"
              >
                <button
                  type="button"
                  data-testid={`article-open-${article.slug}`}
                  onClick={() => setOpenSlug(article.slug)}
                  className="text-left font-sans text-sm font-semibold text-zaid-text hover:text-zaid-accent"
                >
                  {article.title}
                </button>
                <p
                  data-testid={`article-meta-${article.slug}`}
                  className="font-mono text-[10px] text-zaid-muted"
                >
                  {article.readingTime ?? "—"} · {article.date ?? "—"}
                </p>
                <p className="text-xs leading-relaxed text-zaid-text">
                  {article.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ArticleReader({
  article,
  onBack,
}: {
  article: Article;
  onBack: () => void;
}) {
  const body = getArticleBody(article.slug);
  const hasBody = body.trim().length > 0;

  return (
    <div
      data-testid={`article-reader-${article.slug}`}
      className="flex h-full w-full flex-col"
    >
      <div className="flex items-center gap-2 border-b border-zaid-border px-4 py-2">
        <button
          type="button"
          data-testid="article-back"
          onClick={onBack}
          aria-label="Back to articles"
          className="flex h-7 w-7 items-center justify-center rounded text-zaid-muted hover:bg-zaid-surface2 hover:text-zaid-text"
        >
          <Icon name="chevron-left" size={16} />
        </button>
        <span className="min-w-0 flex-1 truncate font-sans text-sm font-semibold text-zaid-text">
          {article.title}
        </span>
        <a
          data-testid={`article-read-full-${article.slug}`}
          href={`/articles/${article.slug}`}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zaid-accent hover:underline"
        >
          Read full article
          <Icon name="external-link" size={12} />
        </a>
      </div>
      {hasBody ? (
        <article
          data-testid={`article-body-${article.slug}`}
          className="article-body min-h-0 flex-1 overflow-y-auto px-6 py-4"
        >
          <ArticleMarkdown markdown={body} />
        </article>
      ) : (
        <p
          data-testid={`article-coming-soon-${article.slug}`}
          className="px-6 py-8 text-center font-mono text-xs text-zaid-muted"
        >
          Article body coming soon
        </p>
      )}
    </div>
  );
}

export default ArticlesApp;
