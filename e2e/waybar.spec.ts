import { expect, test } from "@playwright/test";

/** Skips the boot screen (Enter) and waits for the desktop shell. */
async function bootToDesktop(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 2000 });
}

test.describe("waybar (desktop)", () => {
  // Force a desktop viewport so these assertions are deterministic in the
  // desktop project (1440px shows the bar; mobile hides it).
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders after boot with pills, clock, date, and tray", async ({
    page,
  }) => {
    await bootToDesktop(page);

    const waybar = page.getByTestId("waybar");
    await expect(waybar).toBeVisible();

    // All 5 workspace pills render with their labels.
    for (const [ws, label] of [
      [1, "term"],
      [2, "proj"],
      [3, "web"],
      [4, "soc"],
      [5, "game"],
    ] as const) {
      const pill = page.getByTestId(`waybar-pill-${ws}`);
      await expect(pill).toBeVisible();
      await expect(pill).toContainText(label);
    }
    // Workspace 1 is active by default.
    await expect(page.getByTestId("waybar-pill-1")).toHaveAttribute(
      "data-active",
      "true",
    );

    // Clock is HH:MM and matches the system time within a minute (tolerating
    // the :00 rollover — the clock refreshes every 60s, so it may show the
    // previous minute right after a boundary).
    const clockText =
      (await page.getByTestId("waybar-clock").textContent()) ?? "";
    const clockMatch = clockText.match(/^(\d{2}):(\d{2})$/);
    expect(clockMatch).not.toBeNull();
    const shownMinutes = Number(clockMatch?.[1]) * 60 + Number(clockMatch?.[2]);
    const now = new Date();
    const actualMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = Math.min(
      Math.abs(shownMinutes - actualMinutes),
      1440 - Math.abs(shownMinutes - actualMinutes),
    );
    expect(diff).toBeLessThanOrEqual(2);

    await expect(page.getByTestId("waybar-date")).toBeVisible();
    await expect(page.getByTestId("waybar-uptime")).toContainText(/^up \d+:\d{2}:\d{2}$/);

    // Tray shows demo CPU/RAM percentages as integers in [0,100].
    const trayText = (await page.getByTestId("waybar-tray").textContent()) ?? "";
    const cpuMatch = trayText.match(/CPU (\d+)%/);
    const ramMatch = trayText.match(/RAM (\d+)%/);
    expect(cpuMatch).not.toBeNull();
    expect(ramMatch).not.toBeNull();
    const cpu = Number(cpuMatch?.[1]);
    const ram = Number(ramMatch?.[1]);
    expect(cpu).toBeGreaterThanOrEqual(0);
    expect(cpu).toBeLessThanOrEqual(100);
    expect(ram).toBeGreaterThanOrEqual(0);
    expect(ram).toBeLessThanOrEqual(100);

    // Social links + launcher present.
    await expect(page.getByTestId("waybar-launcher")).toBeVisible();
    await expect(page.getByRole("link", { name: "GitHub" })).toBeVisible();
    await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
  });

  test("clicking a workspace pill switches the active workspace", async ({
    page,
  }) => {
    await bootToDesktop(page);

    const pill3 = page.getByTestId("waybar-pill-3");
    await expect(pill3).toHaveAttribute("data-active", "false");

    await pill3.click();

    // getAttribute returns a Promise — the poll predicate must be async.
    await expect
      .poll(
        async () => (await pill3.getAttribute("data-active")) === "true",
        { timeout: 3000 },
      )
      .toBe(true);
    await expect(page.getByTestId("waybar-pill-1")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  test("power button opens the menu; Reboot replays the boot screen", async ({
    page,
  }) => {
    await bootToDesktop(page);
    await expect(page.getByTestId("power-menu")).not.toBeVisible();

    await page.getByTestId("power-button").click();
    await expect(page.getByTestId("power-menu")).toBeVisible();

    await page.getByTestId("power-menu-reboot").click();
    await expect(page.getByTestId("boot-screen")).toBeVisible({ timeout: 3000 });
  });
});

test.describe("waybar (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hidden on mobile (CSS-only md breakpoint)", async ({ page }) => {
    await bootToDesktop(page);
    await expect(page.getByTestId("waybar")).toBeHidden();
  });
});
