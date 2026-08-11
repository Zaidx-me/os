import { expect, test } from "@playwright/test";

/** The 11 registry apps in APPS order (mirrors src/lib/apps.tsx). */
const APP_IDS = [
  "terminal",
  "about",
  "projects",
  "skills",
  "experience",
  "resume",
  "contact",
  "articles",
  "settings",
  "chat",
  "chess",
] as const;

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

/**
 * Opens the launcher with Mod+Space (Control+Alt+Space on non-mac). The
 * hotkey listener attaches in a React effect AFTER the desktop paints, so a
 * one-shot keypress can land before it is wired. Poll instead: press only
 * while the launcher is closed, so a missed keydown self-heals on retry.
 */
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

/**
 * Task 15 acceptance: every registry app opens from the launcher and renders
 * its window frame with real (lazy) content inside.
 */
test.describe("app window content (todo 15)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const appId of APP_IDS) {
    test(`launcher opens ${appId} into a window with lazy content`, async ({
      page,
    }) => {
      await bootToDesktop(page);
      await openLauncher(page);
      await page.getByTestId("launcher-input").fill(appId);
      await page
        .getByTestId(`launcher-result-${appId}`)
        .click({ timeout: 3000 });

      await expect(page.getByTestId(`window-${appId}`)).toBeVisible({
        timeout: 3000,
      });
      await expect(page.getByTestId(`app-content-${appId}`)).toBeVisible({
        timeout: 3000,
      });
    });
  }

  test("all 11 apps open with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await bootToDesktop(page);
    for (const appId of APP_IDS) {
      await openLauncher(page);
      await page.getByTestId("launcher-input").fill(appId);
      await page
        .getByTestId(`launcher-result-${appId}`)
        .click({ timeout: 3000 });
      await expect(page.getByTestId(`window-${appId}`)).toBeVisible({
        timeout: 3000,
      });
    }
    expect(errors).toEqual([]);
  });
});
