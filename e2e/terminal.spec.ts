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

/** Opens the Terminal window from the launcher and waits for its content. */
async function openTerminal(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("terminal");
  await page.getByTestId("launcher-result-terminal").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-terminal")).toBeVisible({
    timeout: 3000,
  });
}

/** Focuses the hidden shell input and types a line, then Enter. */
async function runCommand(page: import("@playwright/test").Page, line: string) {
  await page.getByTestId("terminal-scroll").click();
  await page.keyboard.type(line);
  await page.keyboard.press("Enter");
}

/**
 * Task 24 acceptance + QA: the simulated shell answers real keystrokes with
 * fake-fs output (ls lists ~), the sudoers joke on elevated commands, and the
 * zsh not-found line for unknowns — no real commands ever run.
 */
test.describe("terminal window (todo 24)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("QA happy: run('ls') lists the ~ entries", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "ls");
    const root = page.getByTestId("app-content-terminal");
    await expect(root).toContainText("README.md", { timeout: 3000 });
    await expect(root).toContainText("dotfiles/");
    await expect(root).toContainText("games/");
    await expect(root).toContainText("projects/");
  });

  test("QA failure: run('sudo nope') returns the sudoers joke", async ({
    page,
  }) => {
    await openTerminal(page);
    await runCommand(page, "sudo nope");
    await expect(page.getByTestId("app-content-terminal")).toContainText(
      "zaid is not in the sudoers file",
      { timeout: 3000 },
    );
  });

  test("unknown commands report zsh: command not found", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "nosuchcmd");
    const root = page.getByTestId("app-content-terminal");
    await expect(root).toContainText("zsh: command not found: nosuchcmd", {
      timeout: 3000,
    });
    await expect(root).toContainText("Type 'help' to see what I can do");
  });
});
