import { expect, test } from "@playwright/test";

async function bootToShell(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 3000 });
  await page.keyboard.press("Enter");
}

/** Task 43 — mobile touch shell (390×844). */
test.describe("mobile shell (todo 39/43)", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 390, height: 844 } });

  test("boot shows mobile home with live projects", async ({ page }) => {
    await bootToShell(page);
    await expect(page.getByTestId("mobile-shell")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("mobile-home")).toBeVisible();
    await expect(page.getByTestId("ios-assistive-touch")).toBeVisible();
    await expect(page.getByTestId("mobile-live-applicator")).toBeVisible();
    await expect(page.getByTestId("desktop")).toHaveCount(0);
    await expect(page.getByTestId("waybar")).toHaveCount(0);
  });

  test("drawer -> Projects -> back round-trip", async ({ page }) => {
    await bootToShell(page);
    await expect(page.getByTestId("mobile-shell")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("mobile-nav-apps").click();
    await expect(page.getByTestId("mobile-drawer")).toBeVisible();
    await page.getByTestId("mobile-app-projects").click();
    await expect(page.getByTestId("mobile-page-projects")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("app-content-projects")).toBeVisible({
      timeout: 5000,
    });
    await page.getByTestId("ios-assistive-home").click();
    await expect(page.getByTestId("mobile-page-projects")).toHaveCount(0);
  });

  test("terminal input works on mobile", async ({ page }) => {
    await bootToShell(page);
    await page.getByTestId("mobile-quick-terminal").click();
    await expect(page.getByTestId("app-content-terminal")).toBeVisible({
      timeout: 5000,
    });
    const input = page.getByTestId("terminal-input");
    await page.getByTestId("mobile-terminal-hint").click();
    await input.fill("help");
    await input.press("Enter");
    await expect(page.getByTestId("app-content-terminal")).toContainText(
      "projects",
      { timeout: 5000 },
    );
  });

  test("chat quick-reply works on mobile", async ({ page }) => {
    await bootToShell(page);
    await page.getByTestId("mobile-quick-chat").click();
    await expect(page.getByTestId("app-content-chat")).toBeVisible({
      timeout: 5000,
    });
    await page.getByTestId("chat-chip-who-are-you?").click();
    await expect(page.getByTestId("chat-message-list")).toContainText(/zaid/i, {
      timeout: 8000,
    });
  });

  test("live project opens in-OS browser on mobile", async ({ page }) => {
    await bootToShell(page);
    await page.getByTestId("mobile-live-applicator").click();
    await expect(page.getByTestId("mobile-page-browser")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("browser-toolbar")).toBeVisible();
    await page.getByTestId("ios-assistive-home").click();
    await expect(page.getByTestId("mobile-home")).toBeVisible();
  });

  test("bottom nav opens browser start page", async ({ page }) => {
    await bootToShell(page);
    await page.getByTestId("mobile-nav-browser").click();
    await expect(page.getByTestId("browser-start-page")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("browser-bookmark-applicator")).toBeVisible();
  });
});
