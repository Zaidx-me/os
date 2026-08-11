import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

/** Opens an app from its desktop icon and waits for the window chrome. */
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

/**
 * Opens the window switcher with Mod+Tab (Control+Alt+Tab on non-mac). The
 * hotkey listener attaches in a React effect AFTER the desktop paints, so a
 * one-shot keypress can land before it is wired. Poll instead: press only
 * while the switcher is closed, so a missed keydown self-heals on retry.
 */
async function openSwitcher(page: import("@playwright/test").Page) {
  await expect
    .poll(
      async () => {
        if (await page.getByTestId("switcher").isVisible()) return true;
        await page.keyboard.press("Control+Alt+Tab");
        return page.getByTestId("switcher").isVisible();
      },
      { timeout: 5000 },
    )
    .toBe(true);
}

test.describe("waybar taskbar + window switcher (Mod+Tab)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("two open windows appear as tasks in the waybar", async ({ page }) => {
    await bootToDesktop(page);
    await openWindow(page, "terminal");
    await openWindow(page, "chess");

    await expect(page.getByTestId("waybar-task-terminal")).toBeVisible();
    await expect(page.getByTestId("waybar-task-chess")).toBeVisible();
  });

  test("clicking a background task focuses that window", async ({ page }) => {
    await bootToDesktop(page);
    const terminal = await openWindow(page, "terminal");
    const chess = await openWindow(page, "chess");
    await expect(chess).toHaveAttribute("data-focused", "true");

    await page.getByTestId("waybar-task-terminal").click();

    await expect(terminal).toHaveAttribute("data-focused", "true", {
      timeout: 2000,
    });
    await expect(chess).toHaveAttribute("data-focused", "false");
  });

  test("clicking the focused task minimizes the window (toggle)", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");

    await page.getByTestId("waybar-task-terminal").click();

    await expect(win).toBeHidden();
    await expect(win).toHaveCount(0, { timeout: 2000 });
    const task = page.getByTestId("waybar-task-terminal");
    await expect(task).toHaveAttribute("data-minimized", "true");

    await task.click();
    await expect(page.getByTestId("window-terminal")).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByTestId("window-terminal")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(task).toHaveAttribute("data-minimized", "false");
  });

  test("clicking a minimized task restores the window", async ({ page }) => {
    await bootToDesktop(page);
    const win = await openWindow(page, "terminal");
    await win.getByTestId("window-minimize").click();
    await expect(win).toHaveCount(0, { timeout: 2000 });
    const task = page.getByTestId("waybar-task-terminal");
    await expect(task).toHaveAttribute("data-minimized", "true");

    await task.click();

    const restored = page.getByTestId("window-terminal");
    await expect(restored).toBeVisible({ timeout: 2000 });
    await expect(restored).toHaveAttribute("data-focused", "true");
  });

  test("Mod+Tab lists windows topmost-first; arrows + Enter select", async ({
    page,
  }) => {
    await bootToDesktop(page);
    const terminal = await openWindow(page, "terminal");
    const chess = await openWindow(page, "chess");
    await expect(chess).toHaveAttribute("data-focused", "true");

    await openSwitcher(page);
    await expect(page.getByTestId("switcher")).toBeVisible();

    const chessOption = page.getByTestId("switcher-option-chess");
    const terminalOption = page.getByTestId("switcher-option-terminal");
    await expect(chessOption).toHaveAttribute("data-active", "true");

    await page.keyboard.press("ArrowDown");
    await expect(terminalOption).toHaveAttribute("data-active", "true");

    await page.keyboard.press("Enter");
    await expect(page.getByTestId("switcher")).toBeHidden();
    await expect(terminal).toHaveAttribute("data-focused", "true", {
      timeout: 2000,
    });
  });

  test("minimized windows are excluded from the switcher", async ({
    page,
  }) => {
    await bootToDesktop(page);
    await openWindow(page, "terminal");
    await openWindow(page, "chess");
    await page.getByTestId("window-chess").getByTestId("window-minimize").click();
    await expect(page.getByTestId("window-chess")).toHaveCount(0, {
      timeout: 2000,
    });

    await openSwitcher(page);

    await expect(page.getByTestId("switcher-option-terminal")).toBeVisible();
    await expect(page.getByTestId("switcher-option-chess")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("switcher")).toBeHidden();
  });

  test("Mod+Tab with no open windows shows no switcher", async ({ page }) => {
    await bootToDesktop(page);
    await expect(page.getByTestId("switcher")).toHaveCount(0);
    await page.keyboard.press("Control+Alt+Tab");
    await expect(page.getByTestId("switcher")).toHaveCount(0);
  });
});
