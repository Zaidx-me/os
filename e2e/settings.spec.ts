import { expect, test } from "@playwright/test";

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

async function openSettings(page: import("@playwright/test").Page, skipBoot = false) {
  if (!skipBoot) {
    await bootToDesktop(page);
  }
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("settings");
  await page.getByTestId("launcher-result-settings").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-settings")).toBeVisible({
    timeout: 3000,
  });
}

/**
 * Task 33 acceptance: Settings wallpaper picker, accent, blur, animations,
 * AI toggle persisted and reflected in ChatApp header.
 */
test.describe("Settings app (todo 33)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("zaidos-settings");
      localStorage.removeItem("zaidos-wallpaper");
    });
  });

  test("acceptance: wallpaper picker changes active wallpaper", async ({
    page,
  }) => {
    await openSettings(page);
    await page.getByTestId("settings-wallpaper-sky").click();
    await expect(page.getByTestId("wallpaper")).toHaveAttribute(
      "data-theme",
      "sky",
    );
  });

  test("accent picker applies CSS variable on document root", async ({
    page,
  }) => {
    await openSettings(page);
    await page.getByTestId("settings-accent-navy").click();
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--color-zaid-accent",
      ),
    );
    expect(accent.trim().toLowerCase()).toBe("#5856d6");
  });

  test("blur toggle sets data-blur on html", async ({ page }) => {
    await openSettings(page);
    await page.getByTestId("settings-tab-system").click();
    await page.getByTestId("settings-blur-toggle").click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.blur),
      )
      .toBe("on");
  });

  test("animations toggle sets data-animations on html", async ({ page }) => {
    await openSettings(page);
    await page.getByTestId("settings-tab-system").click();
    await page.getByTestId("settings-animations-toggle").click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.animations),
      )
      .toBe("off");
  });

  test("AI toggle persists and updates ChatApp header badge", async ({
    page,
  }) => {
    await openSettings(page);
    await page.getByTestId("settings-ai-toggle").click();

    await openLauncher(page);
    await page.getByTestId("launcher-input").fill("chat");
    await page.getByTestId("launcher-result-chat").click({ timeout: 3000 });
    await expect(page.getByTestId("chat-mode-badge")).toHaveText("AI mode");

    await page.getByTestId("window-chat").getByTestId("window-close").click();
    await bootToDesktop(page);
    await openSettings(page, true);
    await expect
      .poll(async () =>
        page.getByTestId("settings-ai-toggle").getAttribute("aria-checked"),
      )
      .toBe("true");
  });

  test("About ZaidOS section renders", async ({ page }) => {
    await openSettings(page);
    await page.getByTestId("settings-tab-about").click();
    await expect(page.getByTestId("settings-about-heading")).toContainText(
      "About ZaidOS",
    );
  });
});
