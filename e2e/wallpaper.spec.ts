import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

test("default matrix wallpaper renders and paints green pixels", async ({
  page,
}) => {
  await bootToDesktop(page);

  const wallpaper = page.getByTestId("wallpaper");
  await expect(wallpaper).toBeVisible();
  await expect(wallpaper).toHaveAttribute("data-theme", "matrix");

  const canvas = wallpaper.locator("canvas");
  await expect(canvas).toBeVisible();

  // The rAF loop is running: the frame counter keeps climbing.
  await expect
    .poll(
      async () =>
        Number((await canvas.getAttribute("data-frames")) ?? "0"),
      { timeout: 3000 },
    )
    .toBeGreaterThan(5);

  // ~1s in, the canvas has actually painted: scan for a green-dominant pixel
  // with visible alpha (bright head glyphs / accent trail cells). Retried so
  // a slow first paint (cold dev-server compile) can't flake the assertion.
  await expect
    .poll(
      () =>
        canvas.evaluate((el) => {
          const c = el as HTMLCanvasElement;
          const ctx = c.getContext("2d");
          if (!ctx || c.width === 0 || c.height === 0) return false;
          const data = ctx.getImageData(0, 0, c.width, c.height).data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const a = data[i + 3];
            if (a > 0 && g > 120 && r < 100) return true;
          }
          return false;
        }),
      { timeout: 5000 },
    )
    .toBe(true);
});

test("store action switches data-theme with a crossfade", async ({ page }) => {
  await bootToDesktop(page);

  const wallpaper = page.getByTestId("wallpaper");
  await expect(wallpaper).toHaveAttribute("data-theme", "matrix");

  // Direct store access via the dev-only debug handle (no picker UI exists
  // yet — todo 10 adds the context-menu "Change Wallpaper" entry).
  await page.evaluate(() => {
    const handle = (
      window as unknown as {
        __zaidosWallpaper?: { setWallpaper: (type: string) => void };
      }
    ).__zaidosWallpaper;
    if (!handle) throw new Error("__zaidosWallpaper debug handle missing");
    handle.setWallpaper("gradient");
  });

  await expect(wallpaper).toHaveAttribute("data-theme", "gradient");
  await expect(wallpaper.getByTestId("gradient-wallpaper")).toBeVisible();
  await expect(wallpaper.getByTestId("matrix-rain")).not.toBeVisible();
});

test("persisted wallpaper rehydrates on reload", async ({ page }) => {
  // Seed the previous visit's choice BEFORE the page loads so the store
  // rehydrates it synchronously at module load.
  await page.addInitScript(() => {
    localStorage.setItem(
      "zaidos-wallpaper",
      JSON.stringify({ state: { type: "light" }, version: 0 }),
    );
  });
  await bootToDesktop(page);

  const wallpaper = page.getByTestId("wallpaper");
  await expect(wallpaper).toHaveAttribute("data-theme", "light");
  await expect(wallpaper.getByTestId("light-wallpaper")).toBeVisible();
});

test("reduced motion: matrix renders a single static frame (no loop)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  // Boot auto-advances under reduced motion — no interaction needed.
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 3000 });

  const canvas = page.getByTestId("wallpaper").locator("canvas");
  await expect(canvas).toBeVisible();

  // Exactly one static frame is painted...
  await expect(canvas).toHaveAttribute("data-frames", "1", { timeout: 2000 });
  // ...and the counter stays frozen: no rAF loop is running.
  await page.waitForTimeout(600);
  await expect(canvas).toHaveAttribute("data-frames", "1");
});
