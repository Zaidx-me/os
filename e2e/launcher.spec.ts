import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

/**
 * Opens the launcher with Mod+Space (Control+Alt+Space on non-mac). The
 * hotkey listener attaches in a React effect AFTER the desktop paints, so a
 * one-shot keypress can land before it is wired. Poll instead: press only
 * while the launcher is closed, so a missed keydown self-heals on retry.
 */
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

test.describe("app launcher (Mod+Space)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Mod+Space opens the launcher; empty query shows the app grid", async ({
    page,
  }) => {
    await bootToDesktop(page);

    await openLauncher(page);
    await expect(page.getByTestId("launcher")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("launcher-grid")).toBeVisible();
    await expect(page.getByTestId("launcher-input")).toBeFocused();
  });

  test("typing 'term' ranks Terminal first; Enter opens the terminal", async ({
    page,
  }) => {
    await bootToDesktop(page);

    await openLauncher(page);
    await page.getByTestId("launcher-input").fill("term");

    const options = page.locator('[data-testid^="launcher-result-"]');
    await expect(options.first()).toHaveAttribute(
      "data-testid",
      "launcher-result-terminal",
    );

    await page.keyboard.press("Enter");

    await expect(page.getByTestId("window-terminal")).toBeVisible({
      timeout: 2000,
    });
  });

  test("ESC closes the launcher", async ({ page }) => {
    await bootToDesktop(page);

    await openLauncher(page);
    // The input gains focus asynchronously (focus effect) — wait for it so the
    // Escape keypress lands on a focused element deterministically.
    await expect(page.getByTestId("launcher-input")).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(page.getByTestId("launcher")).toBeHidden();
  });

  test("click-away closes the launcher", async ({ page }) => {
    await bootToDesktop(page);

    await openLauncher(page);

    await page.getByTestId("launcher-backdrop").click({ position: { x: 10, y: 10 } });

    await expect(page.getByTestId("launcher")).toBeHidden();
  });

  test("'chess' launches the chess app", async ({ page }) => {
    await bootToDesktop(page);

    await openLauncher(page);
    await page.getByTestId("launcher-input").fill("chess");
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("window-chess")).toBeVisible({
      timeout: 2000,
    });
  });

  test("typing in the launcher does not leak keystrokes to a focused window", async ({
    page,
  }) => {
    await bootToDesktop(page);

    // Open a terminal window first so there IS a focused window underneath.
    await page.getByTestId("desktop-icon-terminal").dblclick();
    await expect(page.getByTestId("window-terminal")).toBeVisible();

    await openLauncher(page);
    const input = page.getByTestId("launcher-input");
    await expect(input).toBeFocused();

    await input.fill("chess");

    // Keystrokes stayed in the launcher — no window input leaked.
    await expect(input).toBeFocused();
    const leaked = await page.evaluate(
      () => document.activeElement?.getAttribute("data-testid") ?? null,
    );
    expect(leaked).toBe("launcher-input");
  });
});
