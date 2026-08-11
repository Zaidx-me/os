import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Shared markdown renderer for article bodies (Articles app + SSR routes). */
export function ArticleMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
  );
}
