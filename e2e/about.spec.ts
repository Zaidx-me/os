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

/** Opens the About window from the launcher and waits for its content. */
async function openAbout(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("about");
  await page.getByTestId("launcher-result-about").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-about")).toBeVisible({
    timeout: 3000,
  });
}

/**
 * Task 17 acceptance: open About -> name, role line, >=3 chips render; image
 * has src=/images/profile.jpg.
 */
test.describe("about window (todo 17)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows name, role line, at least 3 chips, and the profile photo", async ({
    page,
  }) => {
    await openAbout(page);

    await expect(page.getByTestId("about-name")).toHaveText(
      "Muhammad Zaid Yaseen",
    );
    await expect(page.getByTestId("about-role")).toHaveText(
      "Developer · Programmer · Engineer · Designer · Modder",
    );
    await expect(page.getByTestId("about-photo")).toHaveAttribute(
      "src",
      /\/images\/profile\.jpg/,
    );

    const chips = await page.locator("[data-testid^='about-chip-']").count();
    expect(chips).toBeGreaterThanOrEqual(3);

    // QA happy: all sections visible.
    await expect(page.getByText("Bio", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Beyond the code", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Quick stats", { exact: true })).toBeVisible();
  });

  // QA failure: assert no string from the old template meta description
  // appears in About DOM.
  test("does not leak the old template meta description", async ({ page }) => {
    await openAbout(page);
    await expect(page.getByTestId("app-content-about")).not.toContainText(
      "product designer working on web & mobile apps",
    );
    await expect(page.getByTestId("app-content-about")).not.toContainText(
      "uses",
    );
  });
});
