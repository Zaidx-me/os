import { expect, test } from "@playwright/test";

/**
 * Task 38 acceptance: metadata, redirects, sitemap, robots, JSON-LD, and
 * article SSR routes (todo 34-37).
 */
test.describe("SEO and routing (todo 38)", () => {
  test("landing page has ZaidOS title and Muhammad Zaid meta description", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ZaidOS/);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /Muhammad Zaid/);
    await expect(description).toHaveAttribute(
      "content",
      /web desktop|Arch Linux ricer/i,
    );

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", "https://zaidx.me");
  });

  test("article SSR route renders h1 from frontmatter", async ({ page }) => {
    const response = await page.goto("/articles/building-whatsapp-gateway");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toHaveText(
      "Building a WhatsApp API Gateway with MCP Server Integration",
    );
  });

  test("unknown article slug returns 404", async ({ page }) => {
    const response = await page.goto("/articles/nope");
    expect(response?.status()).toBe(404);
  });

  test("legacy /projects/:slug redirects permanently to /?app=projects", async ({
    request,
  }) => {
    const response = await request.get("/projects/applicator", {
      maxRedirects: 0,
    });
    expect([301, 308]).toContain(response.status());
    expect(response.headers().location).toBe("/?app=projects");
  });

  test("/contact and /uses redirect permanently to app deep-links", async ({
    request,
  }) => {
    const contact = await request.get("/contact", { maxRedirects: 0 });
    expect([301, 308]).toContain(contact.status());
    expect(contact.headers().location).toBe("/?app=contact");

    const uses = await request.get("/uses", { maxRedirects: 0 });
    expect([301, 308]).toContain(uses.status());
    expect(uses.headers().location).toBe("/?app=about");
  });

  test("article slug is not redirected", async ({ request }) => {
    const response = await request.get(
      "/articles/building-whatsapp-gateway",
      { maxRedirects: 0 },
    );
    expect(response.status()).toBe(200);
  });

  test("sitemap.xml lists home, articles index, and all slugs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("https://zaidx.me");
    expect(body).toContain("https://zaidx.me/articles");
    expect(body).toContain(
      "https://zaidx.me/articles/building-whatsapp-gateway",
    );
    expect(body).toContain(
      "https://zaidx.me/articles/building-offline-urdu-reader",
    );
    expect(body).toContain(
      "https://zaidx.me/articles/designing-university-courseware-platform",
    );
    expect(body).toContain(
      "https://zaidx.me/articles/ai-job-application-assistant",
    );
  });

  test("robots.txt allows crawling and references sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/Allow:\s*\//i);
    expect(body).toContain("https://zaidx.me/sitemap.xml");
  });

  test("humans.txt is served", async ({ request }) => {
    const response = await request.get("/humans.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Muhammad Zaid Yaseen");
    expect(body).toContain("Crafted by yours truly");
  });

  test("JSON-LD Person schema is present with 7 sameAs links", async ({
    page,
  }) => {
    await page.goto("/");
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);
    const parsed = JSON.parse((await jsonLd.textContent()) ?? "{}");
    expect(parsed["@type"]).toBe("Person");
    expect(parsed.name).toBe("Muhammad Zaid Yaseen");
    expect(parsed.sameAs).toHaveLength(7);
    expect(parsed.knowsAbout.length).toBeGreaterThan(0);
  });

  test("?app= deep-link opens the matching window on desktop", async ({
    page,
  }) => {
    await page.goto("/?app=terminal");
    await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("window-terminal")).toBeVisible({
      timeout: 5000,
    });
  });
});
