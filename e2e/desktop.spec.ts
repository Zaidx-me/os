import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

test.describe("desktop icons + context menu", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders one icon per app on the desktop", async ({ page }) => {
    await bootToDesktop(page);

    const apps = [
      "terminal",
      "about",
      "projects",
      "skills",
      "experience",
      "resume",
      "contact",
      "articles",
      "settings",
      "chat",
      "chess",
    ];
    for (const app of apps) {
      await expect(page.getByTestId(`desktop-icon-${app}`)).toBeVisible();
    }
  });

  test("double-clicking an icon opens its window in the workspace", async ({
    page,
  }) => {
    await bootToDesktop(page);

    const icon = page.getByTestId("desktop-icon-projects");
    await icon.dblclick();

    // Pre-window-chrome proxy for the window-projects tile (todo 13 replaces
    // this with a real window chrome bearing data-testid="window-projects").
    await expect(page.getByTestId("ws-window").filter({ has: page.locator('text=projects') })).toBeVisible({
      timeout: 2000,
    });
  });

  test("right-click on the desktop opens the context menu", async ({ page }) => {
    await bootToDesktop(page);

    // Right-click an empty area of the desktop (below the waybar, clear of
    // the icon column) — the context menu must appear and no native menu.
    await page
      .getByTestId("desktop-icons-layer")
      .click({ button: "right", position: { x: 1100, y: 500 } });

    await expect(page.getByTestId("context-menu")).toBeVisible();
    await expect(page.getByTestId("context-menu-open-terminal")).toBeVisible();
  });

  test("context menu Open Terminal opens the terminal", async ({ page }) => {
    await bootToDesktop(page);

    await page
      .getByTestId("desktop-icons-layer")
      .click({ button: "right", position: { x: 1100, y: 500 } });
    await page.getByTestId("context-menu-open-terminal").click();

    await expect(page.getByTestId("ws-window").filter({ has: page.locator('text=terminal') })).toBeVisible({
      timeout: 2000,
    });
  });

  test("context menu Change Wallpaper switches the wallpaper", async ({
    page,
  }) => {
    await bootToDesktop(page);
    await expect(page.getByTestId("wallpaper")).toHaveAttribute(
      "data-theme",
      "matrix",
    );

    await page
      .getByTestId("desktop-icons-layer")
      .click({ button: "right", position: { x: 1100, y: 500 } });
    await page.getByTestId("context-menu-wallpaper").click();
    await page.getByTestId("context-menu-wallpaper-gradient").click();

    await expect(page.getByTestId("wallpaper")).toHaveAttribute(
      "data-theme",
      "gradient",
      { timeout: 2000 },
    );
  });

  test("context menu Reboot replays the boot screen", async ({ page }) => {
    await bootToDesktop(page);

    await page
      .getByTestId("desktop-icons-layer")
      .click({ button: "right", position: { x: 1100, y: 500 } });
    await page.getByTestId("context-menu-reboot").click();

    await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 3000 });
  });

  test("context menu Shut down shows the joke dialog; Dismiss closes it", async ({
    page,
  }) => {
    await bootToDesktop(page);

    await page
      .getByTestId("desktop-icons-layer")
      .click({ button: "right", position: { x: 1100, y: 500 } });
    await page.getByTestId("context-menu-shutdown").click();

    await expect(page.getByTestId("shutdown-dialog")).toBeVisible();
    await page.getByTestId("shutdown-dialog-dismiss").click();
    await expect(page.getByTestId("shutdown-dialog")).toBeHidden();
  });

  test("right-click inside an open window does NOT open the desktop menu", async ({
    page,
  }) => {
    await bootToDesktop(page);

    // Open a terminal window.
    await page.getByTestId("desktop-icon-terminal").dblclick();
    await expect(page.getByTestId("ws-window").filter({ has: page.locator('text=terminal') })).toBeVisible();

    // Right-click the window tile — no desktop context menu may appear.
    const tile = page.getByTestId("ws-window").first();
    await tile.click({ button: "right" });
    await expect(page.getByTestId("context-menu")).toBeHidden();
  });
});
