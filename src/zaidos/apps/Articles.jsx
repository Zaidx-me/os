import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { articles } from "../content/index.ts";
import { getArticleBody } from "../lib/article-bodies.js";

export default function ArticlesApp() {
  const [openSlug, setOpenSlug] = useState(null);
  const open = openSlug ? articles.find((a) => a.slug === openSlug) : null;

  if (open) {
    const body = getArticleBody(open.slug);
    return (
      <div className="mobile-app-scroll flex h-full flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e]">
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 px-4 py-2">
          <button type="button" onClick={() => setOpenSlug(null)} className="text-sm text-blue-600 dark:text-blue-400">← Back</button>
          <span className="text-sm font-semibold truncate text-gray-900 dark:text-white">{open.title}</span>
        </div>
        <div className="mobile-app-scroll flex-1 overflow-y-auto p-4 pb-8 prose prose-sm dark:prose-invert max-w-none sm:p-6">
          {body ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="text-gray-500">Article body coming soon.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app-scroll h-full overflow-y-auto bg-[#f5f5f7] p-4 pb-8 dark:bg-[#1c1c1e] sm:p-6">
      <h1 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Articles</h1>
      <ul className="flex flex-col gap-3">
        {articles.map((a) => (
          <li key={a.slug}>
            <button
              type="button"
              onClick={() => setOpenSlug(a.slug)}
              className="w-full text-left rounded-xl bg-white dark:bg-[#2c2c2e] p-4 shadow-sm border border-black/5 hover:border-blue-500/30"
            >
              <div className="font-semibold text-gray-900 dark:text-white">{a.title}</div>
              <div className="text-[10px] text-gray-500 mt-1">{a.readingTime} · {a.date}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{a.description}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
