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

/** Opens the Projects window from the launcher and waits for its content. */
async function openProjects(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("projects");
  await page.getByTestId("launcher-result-projects").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-projects")).toBeVisible({
    timeout: 3000,
  });
}

/**
 * Task 18 acceptance: open Projects -> >=12 cards; filter Archived ->
 * zenith-build visible; click card -> detail shows stack + links with correct
 * hrefs. QA: repo hrefs match https://github.com/Zaidx-me/<repo>; filter Live
 * -> archived card absent.
 */
test.describe("projects window (todo 18)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders at least 12 cards with filters, and the Archived filter shows zenith-build", async ({
    page,
  }) => {
    await openProjects(page);

    const cards = page.locator("[data-testid^='projects-card-']");
    expect(await cards.count()).toBeGreaterThanOrEqual(12);

    await page.getByTestId("projects-filter-archived").click();
    await expect(page.getByTestId("projects-card-zenith-build")).toBeVisible();
    await expect(page.getByTestId("projects-card-applicator")).toHaveCount(0);

    // QA failure: filter Live -> archived card absent.
    await page.getByTestId("projects-filter-live").click();
    await expect(page.getByTestId("projects-card-zenith-build")).toHaveCount(0);
    await expect(page.getByTestId("projects-card-applicator")).toBeVisible();
  });

  test("clicking a card opens the detail pane with stack and correct link hrefs", async ({
    page,
  }) => {
    await openProjects(page);

    await page.getByTestId("projects-card-whatbot").click();
    await expect(page.getByTestId("projects-detail")).toBeVisible();

    await expect(page.getByTestId("projects-detail-stack")).toContainText(
      "NestJS",
    );

    const repo = page.getByTestId("projects-link-repo");
    await expect(repo).toHaveAttribute(
      "href",
      "https://github.com/Zaidx-me/whatbot",
    );
    await expect(repo).toHaveAttribute("target", "_blank");
    await expect(repo).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("zenith-build detail shows the archived note and no live link", async ({
    page,
  }) => {
    await openProjects(page);

    await page.getByTestId("projects-filter-archived").click();
    await page.getByTestId("projects-card-zenith-build").click();

    await expect(page.getByTestId("projects-detail-archived-note")).toHaveText(
      "Deployed site is archived (404).",
    );
    await expect(page.getByTestId("projects-link-live")).toHaveCount(0);
  });
});
