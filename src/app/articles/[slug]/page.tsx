import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleMarkdown } from "@/components/content/ArticleMarkdown";
import { getArticleBody, getArticleFrontmatter } from "@/content/article-bodies";
import { articles, site } from "@/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

function findArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) {
    return { title: "Article not found" };
  }

  const frontmatter = getArticleFrontmatter(slug);
  const title = frontmatter.title ?? article.title;
  const description = frontmatter.description ?? article.description;
  const url = `${site.siteUrl}/articles/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: frontmatter.date ?? article.date,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ArticlePage({
  params,
}: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  const body = getArticleBody(slug);
  const frontmatter = getArticleFrontmatter(slug);
  const hasBody = body.trim().length > 0;
  const title = frontmatter.title ?? article.title;

  return (
    <main className="min-h-full bg-zaid-bg text-zaid-text">
      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-3 border-b border-zaid-border pb-6">
          <Link
            href="/articles"
            className="font-mono text-[10px] uppercase tracking-wider text-zaid-accent hover:underline"
          >
            ← All articles
          </Link>
          <h1 className="font-sans text-2xl font-bold">{title}</h1>
          <p className="font-mono text-[10px] text-zaid-muted">
            {frontmatter.readingTime ?? article.readingTime ?? "—"} ·{" "}
            {frontmatter.date ?? article.date ?? "—"}
          </p>
          <p className="text-sm leading-relaxed text-zaid-muted">
            {frontmatter.description ?? article.description}
          </p>
          {(frontmatter.tags ?? []).length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {frontmatter.tags!.map((tag) => (
                <li
                  key={tag}
                  className="rounded bg-zaid-surface2 px-2 py-0.5 font-mono text-[10px] text-zaid-accent2"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        {hasBody ? (
          <div className="article-body">
            <ArticleMarkdown markdown={body} />
          </div>
        ) : (
          <p className="py-8 text-center font-mono text-xs text-zaid-muted">
            Full article coming soon
          </p>
        )}

        <footer className="border-t border-zaid-border pt-6">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-wider text-zaid-accent hover:underline"
          >
            Boot ZaidOS →
          </Link>
        </footer>
      </article>
    </main>
  );
}
