import { expect, test } from "@playwright/test";

async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
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

test.describe("browser app", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("launcher opens browser with live project bookmarks", async ({ page }) => {
    await bootToDesktop(page);
    await openLauncher(page);
    await page.getByTestId("launcher-input").fill("browser");
    await page.getByTestId("launcher-result-browser").click({ timeout: 3000 });

    await expect(page.getByTestId("browser-start-page")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("browser-bookmark-applicator")).toBeVisible();
  });

  test("terminal browse command opens a URL in browser", async ({ page }) => {
    await bootToDesktop(page);
    await openLauncher(page);
    await page.getByTestId("launcher-input").fill("terminal");
    await page.getByTestId("launcher-result-terminal").click({ timeout: 3000 });
    await expect(page.getByTestId("terminal-input")).toBeVisible();

    const input = page.getByTestId("terminal-input");
    await input.fill("browse applicator.netlify.app");
    await input.press("Enter");

    await expect(page.getByTestId("browser-toolbar")).toBeVisible({
      timeout: 5000,
    });
  });
});
