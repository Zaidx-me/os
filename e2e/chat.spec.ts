import { expect, test } from "@playwright/test";

/** Boots past the splash screen and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect
    .poll(
      async () => {
        if (await page.getByTestId("desktop").isVisible()) return "ready";
        if (await page.getByTestId("boot-screen").isVisible()) {
          await page.keyboard.press("Enter");
        }
        return "waiting";
      },
      { timeout: 10000 },
    )
    .toBe("ready");
}

/** Polls Mod+Space so a missed keydown self-heals. */
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

async function openChat(page: import("@playwright/test").Page, skipBoot = false) {
  if (!skipBoot) {
    await bootToDesktop(page);
  }
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("chat");
  await page.getByTestId("launcher-result-chat").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-chat")).toBeVisible({
    timeout: 3000,
  });
}

/**
 * Task 31 + 33 acceptance: KB quick-reply, gibberish fallback, history
 * persistence, /api/chat interception for KB fallback (501) and AI mode (llm).
 */
test.describe("ZaidGPT chat (todo 31/33)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("zaidos-chat-history");
      localStorage.setItem(
        "zaidos-settings",
        JSON.stringify({
          state: {
            accent: "matrix",
            blurEnabled: true,
            animationsEnabled: true,
            aiChatEnabled: false,
          },
          version: 0,
        }),
      );
    });
  });

  test("acceptance: quick-reply chip answers with bot bubble", async ({
    page,
  }) => {
    await openChat(page);
    await page.getByTestId("chat-chip-who-are-you?").click();
    await expect(page.getByTestId("chat-typing")).toBeVisible();
    await expect(page.getByTestId("chat-bubble-bot").last()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("chat-bubble-bot").last()).toContainText(
      /Muhammad Zaid/i,
    );
  });

  test("failure: empty input Enter sends no message", async ({ page }) => {
    await openChat(page);
    await page.getByTestId("chat-input").fill("");
    await page.getByTestId("chat-input").press("Enter");
    await expect(page.getByTestId("chat-bubble-user")).toHaveCount(0);
  });

  test("gibberish yields a fallback bot bubble", async ({ page }) => {
    await openChat(page);
    await page.getByTestId("chat-input").fill("asdfgh");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("chat-bubble-bot").last()).toBeVisible({
      timeout: 5000,
    });
  });

  test("history persists across window close and reopen", async ({ page }) => {
    await openChat(page);
    await page.getByTestId("chat-chip-contact").click();
    await expect(page.getByTestId("chat-bubble-bot").last()).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("window-chat").getByTestId("window-close").click();
    await expect(page.getByTestId("window-chat")).toBeHidden({ timeout: 3000 });

    await openChat(page);
    await expect(page.getByTestId("chat-bubble-user")).toHaveCount(1);
    await expect(page.getByTestId("chat-bubble-bot").first()).toBeVisible();
  });

  test("501 /api/chat interception falls back to KB visibly", async ({
    page,
  }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 501,
        contentType: "application/json",
        body: JSON.stringify({ mode: "kb" }),
      }),
    );

    await page.addInitScript(() => {
      localStorage.setItem(
        "zaidos-settings",
        JSON.stringify({
          state: {
            accent: "matrix",
            blurEnabled: true,
            animationsEnabled: true,
            aiChatEnabled: true,
          },
          version: 0,
        }),
      );
    });

    await openChat(page);
    await expect(page.getByTestId("chat-mode-badge")).toHaveText("AI mode");
    await page.getByTestId("chat-input").fill("who are you");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("chat-bubble-bot").last()).toContainText(
      /Muhammad Zaid/i,
      { timeout: 8000 },
    );
  });

  test("mocked LLM content renders and header shows AI mode", async ({
    page,
  }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ mode: "llm", content: "AI says hi" }),
      }),
    );

    await page.addInitScript(() => {
      localStorage.setItem(
        "zaidos-settings",
        JSON.stringify({
          state: {
            accent: "matrix",
            blurEnabled: true,
            animationsEnabled: true,
            aiChatEnabled: true,
          },
          version: 0,
        }),
      );
    });

    await openChat(page);
    await expect(page.getByTestId("chat-mode-badge")).toHaveText("AI mode");
    await page.getByTestId("chat-input").fill("hello");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("chat-bubble-bot").last()).toContainText(
      "AI says hi",
      { timeout: 8000 },
    );
  });

  test("footer joke is visible", async ({ page }) => {
    await openChat(page);
    await expect(page.getByTestId("chat-footer-joke")).toContainText(
      /API-transformer/i,
    );
  });
});
