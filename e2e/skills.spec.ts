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

/** Opens the Skills window from the launcher and waits for its content. */
async function openSkills(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("skills");
  await page.getByTestId("launcher-result-skills").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-skills")).toBeVisible({
    timeout: 3000,
  });
}

/**
 * Task 19 acceptance: open Skills -> all 6 groups render; each has >=1 chip;
 * disclaimer present if bars used. QA: React Native + Hyprland present;
 * failure: no empty groups.
 */
test.describe("skills window (todo 19)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders all 6 groups, each with chips, and the disclaimer", async ({
    page,
  }) => {
    await openSkills(page);

    const groups = [
      "mobile",
      "frontend",
      "backend",
      "ai-devtools",
      "design",
      "systems",
    ];
    for (const id of groups) {
      const group = page.getByTestId(`skills-group-${id}`);
      await expect(group).toBeVisible();
      const chips = group.locator("[data-testid^='skills-chip-']");
      expect(await chips.count()).toBeGreaterThanOrEqual(1);
    }

    await expect(page.getByTestId("skills-disclaimer")).toContainText(
      "vibes, not metrics",
    );
  });

  test("QA happy: React Native and Hyprland are present", async ({ page }) => {
    await openSkills(page);
    await expect(page.getByTestId("skills-chip-react-native")).toBeVisible();
    await expect(page.getByTestId("skills-chip-hyprland")).toBeVisible();
  });
});
