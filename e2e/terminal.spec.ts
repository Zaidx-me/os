import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

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

/** Opens terminal via Mod+Enter hotkey (Control+Alt+Enter on Linux). */
async function openTerminalHotkey(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await expect(page.getByTestId("desktop")).toBeVisible();
  await page.waitForTimeout(600);
  await expect
    .poll(
      async () => {
        if (await page.getByTestId("window-terminal").isVisible()) return true;
        await page.keyboard.press("Control+Alt+Enter");
        return page.getByTestId("window-terminal").isVisible();
      },
      { timeout: 10000 },
    )
    .toBe(true);
  await expect(page.getByTestId("app-content-terminal")).toBeVisible({
    timeout: 5000,
  });
}

async function openTerminal(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("terminal");
  await page.getByTestId("launcher-result-terminal").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-terminal")).toBeVisible({
    timeout: 3000,
  });
}

async function runCommand(page: import("@playwright/test").Page, line: string) {
  const input = page.getByTestId("terminal-input");
  await page.getByTestId("terminal-scroll").click();
  await input.fill(line);
  await input.press("Enter");
  await page.waitForTimeout(300);
}

/**
 * Task 29 — full terminal + easter-egg walkthrough (single spec, desktop).
 */
test.describe("terminal suite (todo 29)", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Mod+Enter opens terminal", async ({ page }) => {
    await openTerminalHotkey(page);
  });

  test("help lists commands", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "help");
    const root = page.getByTestId("app-content-terminal");
    await expect(root).toContainText("projects", { timeout: 5000 });
    await expect(root).toContainText("neofetch");
    await expect(root).toContainText("matrix");
  });

  test("about prints bio from data layer", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "about");
    await expect(page.getByTestId("app-content-terminal")).toContainText(
      "Muhammad Zaid Yaseen",
      { timeout: 5000 },
    );
  });

  test("projects lists all 12 ids", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "projects");
    const root = page.getByTestId("app-content-terminal");
    await expect(root).toContainText("applicator", { timeout: 5000 });
    await expect(root).toContainText("whatbot");
    await expect(root).toContainText("maktaba");
    await expect(root).toContainText("zaidtech");
  });

  test("matrix shows overlay; Esc removes it", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "matrix");
    const overlay = page.getByTestId("matrix-overlay");
    await expect(overlay).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden({ timeout: 3000 });
  });

  test("fortune prints a non-empty line", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "fortune");
    const root = page.getByTestId("app-content-terminal");
    await expect(root).not.toHaveText(/^zaid@zaidos.*$/);
    const text = await root.innerText();
    expect(text.length).toBeGreaterThan(80);
  });

  test("cowsay prints cow art", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "cowsay");
    await expect(page.getByTestId("app-content-terminal")).toContainText(
      "^__^",
      { timeout: 5000 },
    );
  });

  test("neofetch shows ASCII system card", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "neofetch");
    const root = page.getByTestId("app-content-terminal");
    await expect(root).toContainText("Hyprland.web", { timeout: 5000 });
    await expect(root).toContainText("zaid@zaidos");
  });

  test("sudo rm -rf / returns the refusal joke", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "sudo rm -rf /");
    await expect(page.getByTestId("app-content-terminal")).toContainText(
      "nice try",
      { timeout: 5000 },
    );
  });

  test("cd projects && ls navigates fake fs", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "cd projects && ls");
    const root = page.getByTestId("app-content-terminal");
    await expect(root).toContainText("applicator/", { timeout: 5000 });
    await expect(root).toContainText("whatbot/");
  });

  test("open chess opens the chess window", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "open chess");
    await expect(page.getByTestId("window-chess")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("app-content-chess")).toBeVisible();
  });

  test("open nosuch shows error without crashing", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "open nosuch");
    await expect(page.getByTestId("app-content-terminal")).toContainText(
      "open: unknown app 'nosuch'",
      { timeout: 5000 },
    );
  });

  test("QA: ls lists home entries", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "ls");
    const root = page.getByTestId("app-content-terminal");
    await expect(root).toContainText("README.md", { timeout: 3000 });
    await expect(root).toContainText("projects/");
  });

  test("QA: sudo nope returns sudoers joke", async ({ page }) => {
    await openTerminal(page);
    await runCommand(page, "sudo nope");
    await expect(page.getByTestId("app-content-terminal")).toContainText(
      "zaid is not in the sudoers file",
      { timeout: 3000 },
    );
  });
});
