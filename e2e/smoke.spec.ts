import { expect, test } from "@playwright/test";

test("first visit: boot screen appears, Enter skips to desktop", async ({
  page,
}) => {
  // Fresh browser context (Playwright default) -> clean localStorage -> full
  // boot sequence on first load.
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  const bootScreen = page.getByTestId("boot-screen");
  await expect(bootScreen).toBeVisible({ timeout: 2000 });

  // Any key skips immediately.
  await page.keyboard.press("Enter");

  const desktop = page.getByTestId("desktop");
  await expect(desktop).toBeVisible({ timeout: 2000 });
  await expect(bootScreen).not.toBeVisible();
});

test("returning visit: booted flag persists and boot is skipped on reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });

  // localStorage now holds booted=true -> reload skips straight to desktop.
  await page.reload();
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId("boot-screen")).not.toBeVisible();
});

test("reduced motion: boot advances to desktop without interaction or 4s wait", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  // No key press, no 4s auto-continue: the boot screen renders fully-formed
  // and hands over to the desktop on its own.
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 3000 });
});
