import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Task 41/43 — reduced motion + contrast. */
test.describe("reduced motion (todo 41/43)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("boot advances instantly under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId("boot-screen")).not.toBeVisible();
  });

  test("static wallpaper is present under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("teal-wallpaper")).toBeVisible();
  });

  test("axe color-contrast passes on landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 5000 });
    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
