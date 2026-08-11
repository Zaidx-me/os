import type { Metadata } from "next";
import Link from "next/link";
import { articles, site } from "@/content";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Write-ups on WhatsApp gateways, offline Urdu readers, courseware platforms, and AI job tools — by Muhammad Zaid.",
  alternates: {
    canonical: `${site.siteUrl}/articles`,
  },
  openGraph: {
    title: "Articles | ZaidOS",
    description:
      "Write-ups on WhatsApp gateways, offline Urdu readers, courseware platforms, and AI job tools — by Muhammad Zaid.",
    url: `${site.siteUrl}/articles`,
    type: "website",
  },
};

export default function ArticlesPage() {
  return (
    <main className="min-h-full bg-zaid-bg text-zaid-text">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-wider text-zaid-accent hover:underline"
          >
            ← Boot ZaidOS
          </Link>
          <h1 className="font-sans text-2xl font-bold">Articles</h1>
          <p className="text-sm leading-relaxed text-zaid-muted">
            Long-form notes on things I actually built — gateways, readers,
            platforms, and on-device AI.
          </p>
        </header>

        <ul className="flex flex-col gap-4">
          {articles.map((article) => (
            <li
              key={article.slug}
              className="hairline rounded-lg bg-zaid-surface p-5"
            >
              <Link
                href={`/articles/${article.slug}`}
                className="font-sans text-base font-semibold text-zaid-text hover:text-zaid-accent"
              >
                {article.title}
              </Link>
              <p className="mt-1 font-mono text-[10px] text-zaid-muted">
                {article.readingTime ?? "—"} · {article.date ?? "—"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zaid-muted">
                {article.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
