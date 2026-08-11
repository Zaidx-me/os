import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

/**
 * Opens an app from its desktop icon and waits for the window chrome. The
 * open animation (scale 0.96->1 + fade, 200ms) is settled by waiting for
 * opacity 1 so geometry measurements aren't taken mid-animation.
 */
async function openWindow(
  page: import("@playwright/test").Page,
  appId: string,
) {
  await page.getByTestId(`desktop-icon-${appId}`).dblclick();
  const win = page.getByTestId(`window-${appId}`);
  await expect(win).toBeVisible({ timeout: 2000 });
  await expect(win).toHaveCSS("opacity", "1");
  return win;
}

/** Drags from the titlebar center by (dx, dy) and returns the window box. */
async function dragWindow(
  win: import("@playwright/test").Locator,
  dx: number,
  dy: number,
) {
  const titlebar = win.getByTestId("window-titlebar");
  const tb = (await titlebar.boundingBox())!;
  const origin = { x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 };
  await win
    .page()
    .mouse.move(origin.x, origin.y);
  await win.page().mouse.down();
  await win
    .page()
    .mouse.move(origin.x + dx, origin.y + dy, { steps: 4 });
  await win.page().mouse.up();
  return (await win.boundingBox())!;
}

test.describe("window chrome (drag/resize/min/max/close)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dragging the titlebar changes x/y", async ({ page }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    const before = (await win.boundingBox())!;
    const after = await dragWindow(win, 120, 80);
    expect(after.x).toBeCloseTo(before.x + 120, 0);
    expect(after.y).toBeCloseTo(before.y + 80, 0);
  });

  test("dragging beyond the top clamps at the waybar height", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    const titlebar = win.getByTestId("window-titlebar");
    const tb = (await titlebar.boundingBox())!;
    const origin = { x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 };
    await page.mouse.move(origin.x, origin.y);
    await page.mouse.down();
    await page.mouse.move(origin.x, 0, { steps: 4 }); // way above the top
    await page.mouse.up();
    const after = (await win.boundingBox())!;
    expect(after.y).toBeCloseTo(40, 0); // WAYBAR_H
  });

  test("maximize fills the workspace minus the waybar and gutter", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    await win.getByTestId("window-maximize").click();
    const box = (await win.boundingBox())!;
    expect(box.x).toBeCloseTo(8, 0); // gutter
    expect(box.y).toBeCloseTo(48, 0); // waybar 40 + gutter 8
    expect(box.width).toBeCloseTo(1424, 0); // 1440 - 2*8
    expect(box.height).toBeCloseTo(844, 0); // 900 - 40 - 2*8
    await expect(win).toHaveAttribute("data-maximized", "true");
  });

  test("maximize then drag does NOT move the window (restore first)", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    await win.getByTestId("window-maximize").click();
    const before = (await win.boundingBox())!;
    const after = await dragWindow(win, 200, 100);
    expect(after.x).toBeCloseTo(before.x, 0);
    expect(after.y).toBeCloseTo(before.y, 0);
    expect(after.width).toBeCloseTo(before.width, 0);
  });

  test("double-clicking the title maximizes; a second double-click restores", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    const titlebar = win.getByTestId("window-titlebar");
    await titlebar.dblclick();
    await expect(win).toHaveAttribute("data-maximized", "true");
    const box = (await win.boundingBox())!;
    expect(box.height).toBeCloseTo(844, 0);
    await titlebar.dblclick();
    await expect(win).toHaveAttribute("data-maximized", "false");
  });

  test("minimize hides (aria-hidden) and keeps the window tracked as a task", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    await win.getByTestId("window-minimize").click();
    await expect(win).toHaveAttribute("aria-hidden", "true");
    await expect(win).toBeHidden();
    await expect(win).toHaveAttribute("data-minimized", "true");
    // still mounted — the (todo 16) waybar task can restore it
    await expect(win).toHaveCount(1);
  });

  test("close removes the window", async ({ page }) => {
    await bootToDesktop(page);
    await openWindow(page, "terminal");
    await page.getByTestId("window-terminal").getByTestId("window-close").click();
    await expect(page.getByTestId("window-terminal")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("SE-resize grows width and height", async ({ page }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    const before = (await win.boundingBox())!;
    const handle = win.getByTestId("window-resize-se");
    const hb = (await handle.boundingBox())!;
    const origin = { x: hb.x + hb.width / 2, y: hb.y + hb.height / 2 };
    await page.mouse.move(origin.x, origin.y);
    await page.mouse.down();
    await page.mouse.move(origin.x + 100, origin.y + 80, { steps: 4 });
    await page.mouse.up();
    const after = (await win.boundingBox())!;
    expect(after.width).toBeCloseTo(before.width + 100, 0);
    expect(after.height).toBeCloseTo(before.height + 80, 0);
    expect(after.x).toBeCloseTo(before.x, 0);
    expect(after.y).toBeCloseTo(before.y, 0);
  });

  test("clicking a window focuses it (data-focused + raised above the rest)", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const terminal = await openWindow(page, "terminal");
    // Move terminal to the top-left so the next window (opened centered)
    // does not cover it.
    await dragWindow(terminal, -350, -100);

    const chess = await openWindow(page, "chess");
    await expect(chess).toHaveAttribute("data-focused", "true");

    // Click the exposed titlebar of the terminal window.
    await terminal
      .getByTestId("window-titlebar")
      .click({ position: { x: 20, y: 18 } });
    await expect(terminal).toHaveAttribute("data-focused", "true");
    await expect(chess).toHaveAttribute("data-focused", "false");
  });
});
