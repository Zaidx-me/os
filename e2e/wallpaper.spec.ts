import { expect, test } from "@playwright/test";

async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

test("default teal wallpaper renders as a static gradient", async ({ page }) => {
  await bootToDesktop(page);

  const wallpaper = page.getByTestId("wallpaper");
  await expect(wallpaper).toBeVisible();
  await expect(wallpaper).toHaveAttribute("data-theme", "teal");
  await expect(wallpaper.getByTestId("teal-wallpaper")).toBeVisible();
  await expect(wallpaper.locator("canvas")).toHaveCount(0);
});

test("store action switches data-theme", async ({ page }) => {
  await bootToDesktop(page);

  const wallpaper = page.getByTestId("wallpaper");
  await expect(wallpaper).toHaveAttribute("data-theme", "teal");

  await page.evaluate(() => {
    const handle = (
      window as unknown as {
        __zaidosWallpaper?: { setWallpaper: (type: string) => void };
      }
    ).__zaidosWallpaper;
    if (!handle) throw new Error("__zaidosWallpaper debug handle missing");
    handle.setWallpaper("sky");
  });

  await expect(wallpaper).toHaveAttribute("data-theme", "sky");
  await expect(wallpaper.getByTestId("sky-wallpaper")).toBeVisible();
});

test("persisted wallpaper rehydrates on reload", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "zaidos-wallpaper",
      JSON.stringify({ state: { type: "sand" }, version: 0 }),
    );
  });
  await bootToDesktop(page);

  const wallpaper = page.getByTestId("wallpaper");
  await expect(wallpaper).toHaveAttribute("data-theme", "sand");
  await expect(wallpaper.getByTestId("sand-wallpaper")).toBeVisible();
});

test("legacy matrix wallpaper migrates to slate on reload", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "zaidos-wallpaper",
      JSON.stringify({ state: { type: "matrix" }, version: 0 }),
    );
  });
  await bootToDesktop(page);

  await expect(page.getByTestId("wallpaper")).toHaveAttribute("data-theme", "slate");
});
