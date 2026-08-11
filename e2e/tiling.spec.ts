import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

/** Opens an app and waits for its window to settle (open animation done). */
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

/** Drags the titlebar to the absolute (x, y) pointer position and releases. */
async function dragTitlebarTo(
  win: import("@playwright/test").Locator,
  x: number,
  y: number,
) {
  const titlebar = win.getByTestId("window-titlebar");
  const tb = (await titlebar.boundingBox())!;
  const origin = { x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 };
  await win.page().mouse.move(origin.x, origin.y);
  await win.page().mouse.down();
  await win.page().mouse.move(x, y, { steps: 6 });
  await win.page().mouse.up();
}

/**
 * Edge-snap tiling (todo 14). All geometry asserted against the exact snap
 * math at 1440x900 (acceptance: within ±2px):
 *   left : x=8,  y=48, w=1440/2-12=708, h=844
 *   right: x=724, y=48, w=708,           h=844
 *   full : x=8,  y=48, w=1424,           h=844
 * Keyboard tiling is Ctrl+Alt+Arrow on non-Mac (the Playwright host resolves
 * Mod = Ctrl+Alt), and Mod+F toggles float restore.
 */
test.describe("edge-snap tiling", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dragging to the left edge snaps to the left half", async ({ page }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    await dragTitlebarTo(win, 30, 300); // pointer inside the left 40px band
    await expect(win).toHaveAttribute("data-mode", "tile");
    const box = (await win.boundingBox())!;
    expect(box.x).toBeCloseTo(8, 0);
    expect(box.y).toBeCloseTo(48, 0);
    expect(box.width).toBeCloseTo(708, 0);
    expect(box.height).toBeCloseTo(844, 0);
  });

  test("two windows snap side-by-side (left and right halves)", async ({
    page,
  }) => {
    await bootToDesktop(page);
    // Snap chess RIGHT first: the right half never covers the top-left icon
    // grid, so the terminal icon stays clickable afterwards.
    const chess = await openWindow(page, "chess");
    await dragTitlebarTo(chess, 1440 - 30, 300); // right 40px band
    await expect(chess).toHaveAttribute("data-mode", "tile");
    const right = (await chess.boundingBox())!;
    expect(right.x).toBeCloseTo(724, 0);
    expect(right.width).toBeCloseTo(708, 0);

    const terminal = await openWindow(page, "terminal");
    await dragTitlebarTo(terminal, 30, 300); // left 40px band
    await expect(terminal).toHaveAttribute("data-mode", "tile");
    const left = (await terminal.boundingBox())!;
    expect(left.x).toBeCloseTo(8, 0);
    expect(left.width).toBeCloseTo(708, 0);
    // the two panes sit flush side-by-side with the 8px center gap
    expect(right.x - (left.x + left.width)).toBeCloseTo(8, 0);
    expect(right.x + right.width).toBeCloseTo(1440 - 8, 0);
  });

  test("dragging to the very top edge snaps full size", async ({ page }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    await dragTitlebarTo(win, 700, 0); // pointer inside the top 40px band
    await expect(win).toHaveAttribute("data-mode", "tile");
    const box = (await win.boundingBox())!;
    expect(box.x).toBeCloseTo(8, 0);
    expect(box.y).toBeCloseTo(48, 0);
    expect(box.width).toBeCloseTo(1424, 0);
    expect(box.height).toBeCloseTo(844, 0);
  });

  test("dropping away from an edge (<40px) keeps the drag position", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    const before = (await win.boundingBox())!;
    const titlebar = win.getByTestId("window-titlebar");
    const tb = (await titlebar.boundingBox())!;
    const origin = { x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 };
    await page.mouse.move(origin.x, origin.y);
    await page.mouse.down();
    await page.mouse.move(origin.x + 120, origin.y + 80, { steps: 6 });
    await page.mouse.up();
    const after = (await win.boundingBox())!;
    expect(after.x).toBeCloseTo(before.x + 120, 0);
    expect(after.y).toBeCloseTo(before.y + 80, 0);
    await expect(win).toHaveAttribute("data-mode", "float");
  });
});

test.describe("keyboard tiling (Mod+Arrow / Mod+F)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Mod+ArrowLeft tiles the focused window to the left half", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    await page.keyboard.press("Control+Alt+ArrowLeft");
    await expect(win).toHaveAttribute("data-mode", "tile");
    const box = (await win.boundingBox())!;
    expect(box.x).toBeCloseTo(8, 0);
    expect(box.width).toBeCloseTo(708, 0);
  });

  test("Mod+F restores the pre-snap float bounds", async ({ page }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    const before = (await win.boundingBox())!;
    await page.keyboard.press("Control+Alt+ArrowRight");
    await expect(win).toHaveAttribute("data-mode", "tile");
    const tiled = (await win.boundingBox())!;
    expect(tiled.x).toBeCloseTo(724, 0);

    await page.keyboard.press("Control+Alt+f");
    await expect(win).toHaveAttribute("data-mode", "float");
    const restored = (await win.boundingBox())!;
    expect(restored.x).toBeCloseTo(before.x, 1);
    expect(restored.y).toBeCloseTo(before.y, 1);
    expect(restored.width).toBeCloseTo(before.width, 1);
    expect(restored.height).toBeCloseTo(before.height, 1);
  });
});
