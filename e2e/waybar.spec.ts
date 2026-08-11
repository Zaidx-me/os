import { expect, test } from "@playwright/test";

async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

test.describe("waybar (desktop)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders after boot with Spotlight, clock, and dock", async ({ page }) => {
    await bootToDesktop(page);

    await expect(page.getByTestId("waybar")).toBeVisible();
    await expect(page.getByTestId("waybar-brand")).toBeVisible();
    await expect(page.getByTestId("waybar-spotlight")).toBeVisible();
    await expect(page.getByTestId("waybar-clock")).toBeVisible();
    await expect(page.getByTestId("dock")).toBeVisible();
  });

  test("Spotlight opens the launcher", async ({ page }) => {
    await bootToDesktop(page);
    await page.getByTestId("waybar-spotlight").click();
    await expect(page.getByTestId("launcher")).toBeVisible();
    await expect(page.getByTestId("launcher-input")).toBeFocused();
  });

  test("clock matches system time within a minute", async ({ page }) => {
    await bootToDesktop(page);
    const clockText =
      (await page.getByTestId("waybar-clock").textContent()) ?? "";
    const clockMatch = clockText.match(/^(\d{2}):(\d{2})$/);
    expect(clockMatch).not.toBeNull();
    const shownMinutes = Number(clockMatch?.[1]) * 60 + Number(clockMatch?.[2]);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    expect(Math.abs(shownMinutes - nowMinutes)).toBeLessThanOrEqual(1);
  });

  test("waybar-launcher button still opens Spotlight", async ({ page }) => {
    await bootToDesktop(page);
    await page.getByTestId("waybar-launcher").click();
    await expect(page.getByTestId("launcher")).toBeVisible();
  });
});
