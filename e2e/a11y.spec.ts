import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 3000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 5000 });
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

/** Task 40/43 — keyboard nav + axe scans. */
test.describe("accessibility (todo 40/43)", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1440, height: 900 } });

  test("skip link focuses main content", async ({ page }) => {
    await bootToDesktop(page);
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to desktop/i });
    await expect(skip).toBeFocused();
  });

  test("Tab reaches launcher; Escape closes it", async ({ page }) => {
    await bootToDesktop(page);
    await openLauncher(page);
    await expect(page.getByTestId("launcher")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("launcher")).toBeHidden({ timeout: 3000 });
  });

  test("axe: landing has no critical or serious violations", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const bad = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(bad).toEqual([]);
  });

  test("axe: terminal window has no critical or serious violations", async ({
    page,
  }) => {
    await bootToDesktop(page);
    await openLauncher(page);
    await page.getByTestId("launcher-input").fill("terminal");
    await page.getByTestId("launcher-result-terminal").click();
    await expect(page.getByTestId("app-content-terminal")).toBeVisible({
      timeout: 5000,
    });
    const results = await new AxeBuilder({ page })
      .include('[data-testid="app-content-terminal"]')
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const bad = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(bad).toEqual([]);
  });

  test("axe: chat window has no critical or serious violations", async ({
    page,
  }) => {
    await bootToDesktop(page);
    await openLauncher(page);
    await page.getByTestId("launcher-input").fill("chat");
    await page.getByTestId("launcher-result-chat").click();
    await expect(page.getByTestId("app-content-chat")).toBeVisible({
      timeout: 5000,
    });
    const results = await new AxeBuilder({ page })
      .include('[data-testid="app-content-chat"]')
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const bad = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(bad).toEqual([]);
  });
});
