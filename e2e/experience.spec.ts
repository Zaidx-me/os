import { expect, test } from "@playwright/test";

/** Boots past the splash screen and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

/** Polls Mod+Space so a missed keydown self-heals (hotkey wires in an effect). */
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

/** Opens the Experience window from the launcher and waits for its content. */
async function openExperience(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("experience");
  await page.getByTestId("launcher-result-experience").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-experience")).toBeVisible({
    timeout: 3000,
  });
}

/**
 * Task 20 acceptance: open Experience -> timeline shows >=3 entries incl.
 * BSIT + freelance graphic design + C++ freelance; education labeled.
 */
test.describe("experience window (todo 20)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("timeline renders >=3 entries incl. BSIT, graphic design, and C++ freelance with education labeled", async ({
    page,
  }) => {
    await openExperience(page);

    const entries = page.locator("[data-testid^='experience-entry-']");
    expect(await entries.count()).toBeGreaterThanOrEqual(3);

    await expect(page.getByTestId("experience-entry-bsit-punjab")).toBeVisible();
    await expect(
      page.getByTestId("experience-entry-freelance-graphic-design"),
    ).toBeVisible();
    await expect(
      page.getByTestId("experience-entry-project-on-demand"),
    ).toBeVisible();

    const education = page.getByTestId("experience-group-education");
    await expect(education).toContainText("Education");
    await expect(education).toContainText("University of the Punjab");
  });

  test("QA happy: factual org names render; QA failure: unknown date is '—' not 'undefined'", async ({
    page,
  }) => {
    await openExperience(page);

    await expect(
      page.getByTestId("experience-org-freelance-graphic-design"),
    ).toHaveText("Self Employed");
    await expect(
      page.getByTestId("experience-period-freelance-graphic-design"),
    ).toHaveText("—");

    const body = page.getByTestId("app-content-experience");
    await expect(body).not.toContainText("undefined");
  });
});
