import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

test.describe("app launcher (Mod+Space)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Mod+Space opens the launcher; empty query shows the app grid", async ({
    page,
  }) => {
    await bootToDesktop(page);

    await page.keyboard.press("Control+Alt+Space");
    await expect(page.getByTestId("launcher")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("launcher-grid")).toBeVisible();
    await expect(page.getByTestId("launcher-input")).toBeFocused();
  });

  test("typing 'term' ranks Terminal first; Enter opens the terminal", async ({
    page,
  }) => {
    await bootToDesktop(page);

    await page.keyboard.press("Control+Alt+Space");
    await page.getByTestId("launcher-input").fill("term");

    const options = page.locator('[data-testid^="launcher-result-"]');
    await expect(options.first()).toHaveAttribute(
      "data-testid",
      "launcher-result-terminal",
    );

    await page.keyboard.press("Enter");

    await expect(page.getByTestId("ws-window").filter({ has: page.locator('text=terminal') })).toBeVisible({
      timeout: 2000,
    });
  });

  test("ESC closes the launcher", async ({ page }) => {
    await bootToDesktop(page);

    await page.keyboard.press("Control+Alt+Space");
    await expect(page.getByTestId("launcher")).toBeVisible();
    // The input gains focus asynchronously (focus effect) — wait for it so the
    // Escape keypress lands on a focused element deterministically.
    await expect(page.getByTestId("launcher-input")).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(page.getByTestId("launcher")).toBeHidden();
  });

  test("click-away closes the launcher", async ({ page }) => {
    await bootToDesktop(page);

    await page.keyboard.press("Control+Alt+Space");
    await expect(page.getByTestId("launcher")).toBeVisible();

    await page.getByTestId("launcher-backdrop").click({ position: { x: 10, y: 10 } });

    await expect(page.getByTestId("launcher")).toBeHidden();
  });

  test("'chess' launches the chess app", async ({ page }) => {
    await bootToDesktop(page);

    await page.keyboard.press("Control+Alt+Space");
    await page.getByTestId("launcher-input").fill("chess");
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("ws-window").filter({ has: page.locator('text=chess') })).toBeVisible({
      timeout: 2000,
    });
  });

  test("typing in the launcher does not leak keystrokes to a focused window", async ({
    page,
  }) => {
    await bootToDesktop(page);

    // Open a terminal window first so there IS a focused window underneath.
    await page.getByTestId("desktop-icon-terminal").dblclick();
    await expect(page.getByTestId("ws-window").filter({ has: page.locator('text=terminal') })).toBeVisible();

    await page.keyboard.press("Control+Alt+Space");
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
