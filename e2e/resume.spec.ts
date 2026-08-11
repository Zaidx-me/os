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

/** Opens the Resume window from the launcher and waits for its sheet. */
async function openResume(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("resume");
  await page.getByTestId("launcher-result-resume").click({ timeout: 3000 });
  await expect(page.getByTestId("resume-sheet")).toBeVisible({ timeout: 3000 });
}

/**
 * Task 21 acceptance: open Resume -> name + sections render; click Download
 * PDF -> window.print called (stubbed via evaluate override).
 */
test.describe("resume window (todo 21)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders name + all sections and Download PDF triggers window.print", async ({
    page,
  }) => {
    // Stub window.print BEFORE the app loads; the fallback path calls it.
    await page.addInitScript(() => {
      (window as unknown as { __printed?: boolean }).__printed = false;
      window.print = () => {
        (window as unknown as { __printed?: boolean }).__printed = true;
      };
    });
    await openResume(page);

    await expect(page.getByTestId("resume-name")).not.toBeEmpty();
    for (const section of ["summary", "skills", "experience", "education", "projects"]) {
      await expect(page.getByTestId(`resume-${section}`)).toBeVisible();
    }

    await page.getByTestId("resume-print").click();
    const printed = await page.evaluate(
      () => (window as unknown as { __printed?: boolean }).__printed,
    );
    expect(printed).toBe(true);
  });

  test("QA: with print media emulation the resume sheet shows and desktop chrome is display:none", async ({
    page,
  }) => {
    await openResume(page);

    await page.emulateMedia({ media: "print" });

    await expect
      .poll(async () => {
        return page.getByTestId("resume-sheet").evaluate(
          (el) => getComputedStyle(el).display !== "none",
        );
      })
      .toBe(true);

    const chromeHidden = await page.evaluate(() => {
      const ids = [
        "waybar",
        "desktop-icons-layer",
        "launcher",
        "switcher",
        "wallpaper",
      ];
      return ids.every((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        return el === null || getComputedStyle(el).display === "none";
      });
    });
    expect(chromeHidden).toBe(true);
  });
});
