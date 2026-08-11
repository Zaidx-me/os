import { expect, test } from "@playwright/test";

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

async function openChess(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("chess");
  await page.getByTestId("launcher-result-chess").click({ timeout: 3000 });
  await expect(page.getByTestId("app-content-chess")).toBeVisible({
    timeout: 5000,
  });
}

/** Task 29 — chess e2e (desktop). */
test.describe("chess app (todo 29)", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1440, height: 900 } });

  test("QA happy: pawn e2-e4 advances", async ({ page }) => {
    await openChess(page);
    await page.getByTestId("chess-square-e2").click();
    await page.getByTestId("chess-square-e4").click();
    await expect(page.getByTestId("chess-square-e4")).toContainText("♙");
    await expect(page.getByTestId("chess-square-e2")).not.toContainText("♙");
  });

  test("QA failure: illegal rook move rejected", async ({ page }) => {
    await openChess(page);
    await page.getByTestId("chess-square-e2").click();
    await page.getByTestId("chess-square-e4").click();
    await page.getByTestId("chess-square-a1").click();
    await page.getByTestId("chess-square-a5").click();
    await expect(page.getByTestId("chess-square-a1")).toContainText("♖");
    await expect(page.getByTestId("chess-square-a5")).not.toContainText("♖");
  });

  test("checkmate banner on Scholar's mate setup", async ({ page }) => {
    await openChess(page);
    const moves = ["e2", "e4", "e7", "e5", "d1", "h5", "b8", "c6", "f1", "c4", "g8", "f6", "h5", "f7"];
    for (let i = 0; i < moves.length; i += 2) {
      await page.getByTestId(`chess-square-${moves[i]}`).click();
      await page.getByTestId(`chess-square-${moves[i + 1]}`).click();
    }
    await expect(page.getByTestId("chess-banner")).toContainText(/checkmate/i, {
      timeout: 5000,
    });
  });
});
