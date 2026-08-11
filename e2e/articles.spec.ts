import { expect, test } from "@playwright/test";

/** Boots past the splash screen and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

/** Polls Mod+Space so a missed keydown self-heals (hotkey wires in an effect). */
async function openLauncher(page: import("@playwright/test").Page) {
  await expect
    .poll(
      async () => {
        if (await page.getByTestId("launcher").isVisible()) return true;
        await page.keyboard.press("Control+Alt+Space");
        return page.getByTestId("launcher").isVisible();
      },
      { timeout: 5000 },
    )
    .toBe(true);
}

/** Opens the Articles window from the launcher and waits for its content. */
async function openArticles(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("articles");
  await page.getByTestId("launcher-result-articles").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-articles")).toBeVisible({
    timeout: 3000,
  });
}

/**
 * Task 23 acceptance: open Articles -> list shows exactly the 4 published
 * articles; opening the first renders its markdown body (h1 + paragraphs).
 * QA happy: headings render; the back button returns to the list; the
 * "Read full article" link points at the SSR route /articles/<slug>.
 */
test.describe("articles window (todo 23)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("acceptance: list shows 4 articles and the first opens with h1 + paragraphs", async ({
    page,
  }) => {
    await openArticles(page);

    const items = page.locator("[data-testid^='article-item-']");
    expect(await items.count()).toBe(4);
    for (const slug of [
      "building-whatsapp-gateway",
      "building-offline-urdu-reader",
      "designing-university-courseware-platform",
      "ai-job-application-assistant",
    ]) {
      await expect(page.getByTestId(`article-item-${slug}`)).toBeVisible();
    }

    await page.getByTestId("article-open-building-whatsapp-gateway").click();
    const body = page.getByTestId("article-body-building-whatsapp-gateway");
    await expect(body).toBeVisible({ timeout: 3000 });
    await expect(body.locator("h1").first()).toHaveText(
      "Building a WhatsApp API Gateway with MCP Server Integration",
    );
    expect(await body.locator("p").count()).toBeGreaterThan(0);
  });

  test("QA happy: headings render; back returns to the list; read-full links to SSR route", async ({
    page,
  }) => {
    await openArticles(page);

    await page.getByTestId("article-open-building-offline-urdu-reader").click();
    const body = page.getByTestId("article-body-building-offline-urdu-reader");
    await expect(body).toBeVisible({ timeout: 3000 });
    await expect(body.locator("h1").first()).toHaveText(
      "Building an Offline-First Urdu Book Reader",
    );
    expect(await body.locator("h2").count()).toBeGreaterThan(0);

    await expect(
      page.getByTestId("article-read-full-building-offline-urdu-reader"),
    ).toHaveAttribute("href", "/articles/building-offline-urdu-reader");

    await page.getByTestId("article-back").click();
    await expect(
      page.getByTestId("article-item-building-offline-urdu-reader"),
    ).toBeVisible();
    await expect(
      page.getByTestId("article-item-building-whatsapp-gateway"),
    ).toBeVisible();
  });
});
