import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { articles } from "@/content";

/**
 * Articles (articles) content tests (todo 23 acceptance): the list renders
 * exactly the 4 published articles with title/description; opening the first
 * renders the markdown body (h1 + paragraphs); QA happy: headings render;
 * QA failure: a missing/empty body file shows "Article body coming soon"
 * instead of crashing; the back button returns to the list.
 */
describe("ArticlesApp", () => {
  async function renderWithRealBodies() {
    const { ArticlesApp } = await import("@/components/apps/ArticlesApp");
    render(<ArticlesApp />);
    return ArticlesApp;
  }

  it("renders exactly the 4 published articles with title and description", async () => {
    await renderWithRealBodies();
    expect(articles).toHaveLength(4);
    const norm = (s: string) => s.replace(/\s+/g, " ").trim();
    for (const article of articles) {
      const item = screen.getByTestId(`article-item-${article.slug}`);
      expect(norm(item.textContent ?? "")).toContain(norm(article.title));
      expect(norm(item.textContent ?? "")).toContain(norm(article.description));
    }
  });

  it("renders date and reading time in meta (never 'undefined')", async () => {
    await renderWithRealBodies();
    for (const article of articles) {
      const meta = screen.getByTestId(`article-meta-${article.slug}`);
      expect(meta).toHaveTextContent(article.readingTime ?? "—");
      expect(meta).toHaveTextContent(article.date ?? "—");
      expect(meta).not.toHaveTextContent("undefined");
    }
  });

  it("acceptance: opening the first article renders the markdown body (h1 + paragraphs)", async () => {
    await renderWithRealBodies();
    const first = articles[0];
    fireEvent.click(screen.getByTestId(`article-open-${first.slug}`));
    const body = screen.getByTestId(`article-body-${first.slug}`);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      first.title,
    );
    expect(body.querySelectorAll("p").length).toBeGreaterThan(0);
  });

  it("QA happy: article renders markdown headings", async () => {
    await renderWithRealBodies();
    const first = articles[0];
    fireEvent.click(screen.getByTestId(`article-open-${first.slug}`));
    const body = screen.getByTestId(`article-body-${first.slug}`);
    expect(body.querySelectorAll("h1").length).toBeGreaterThan(0);
    expect(body.querySelectorAll("h2").length).toBeGreaterThan(0);
  });

  it('"Read full article" links to /articles/<slug>', async () => {
    await renderWithRealBodies();
    const first = articles[0];
    fireEvent.click(screen.getByTestId(`article-open-${first.slug}`));
    expect(screen.getByTestId(`article-read-full-${first.slug}`)).toHaveAttribute(
      "href",
      `/articles/${first.slug}`,
    );
  });

  it("back button returns to the list", async () => {
    await renderWithRealBodies();
    const first = articles[0];
    fireEvent.click(screen.getByTestId(`article-open-${first.slug}`));
    expect(
      screen.getByTestId(`article-reader-${first.slug}`),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("article-back"));
    expect(
      screen.getByTestId(`article-item-${first.slug}`),
    ).toBeInTheDocument();
    expect(screen.getByTestId("app-content-articles")).toBeInTheDocument();
  });

  // Last: the doMock below must not leak into the tests above.
  it("QA failure: missing body file shows 'Article body coming soon' instead of crashing", async () => {
    vi.resetModules();
    vi.doMock("@/content/article-bodies", () => ({
      articleBodies: {},
      getArticleBody: () => "",
    }));
    const { ArticlesApp } = await import("@/components/apps/ArticlesApp");
    render(<ArticlesApp />);
    const first = articles[0];
    fireEvent.click(screen.getByTestId(`article-open-${first.slug}`));
    expect(
      screen.getByTestId(`article-coming-soon-${first.slug}`),
    ).toHaveTextContent("Article body coming soon");
    expect(screen.queryByTestId(`article-body-${first.slug}`)).not.toBeInTheDocument();
  });
});
