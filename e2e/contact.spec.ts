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

/** Opens the Contact window from the launcher and waits for its form. */
async function openContact(page: import("@playwright/test").Page) {
  await bootToDesktop(page);
  await openLauncher(page);
  await page.getByTestId("launcher-input").fill("contact");
  await page.getByTestId("launcher-result-contact").click({ timeout: 3000 });
  await expect(page.getByTestId("contact-form")).toBeVisible({ timeout: 3000 });
}

/** Fills every field with a valid payload. */
async function fillValidForm(page: import("@playwright/test").Page) {
  await page.getByTestId("contact-name").fill("Zaid");
  await page.getByTestId("contact-email").fill("zaid@example.com");
  await page.getByTestId("contact-subject").fill("Hello");
  await page.getByTestId("contact-message").fill("Nice desktop.");
}

/**
 * Task 22 acceptance + QA: open Contact -> form renders with fields +
 * submit; typed input reaches state; submit success (200) shows the green
 * message; failures per plan: route 501 or network abort -> mailto: link
 * composed from subject/body; 429 -> rate-limit message, NO mailto (which
 * would bypass the rate limit). /api/contact is intercepted so the tests
 * never touch the real (env-gated) Resend path.
 */
test.describe("contact window (todo 22)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("acceptance: form renders and typed input reaches state", async ({
    page,
  }) => {
    await openContact(page);

    for (const field of ["name", "email", "subject", "message"]) {
      await expect(page.getByTestId(`contact-${field}`)).toBeVisible();
    }
    await expect(page.getByTestId("contact-submit")).toBeVisible();

    await fillValidForm(page);
    await expect(page.getByTestId("contact-name")).toHaveValue("Zaid");
    await expect(page.getByTestId("contact-email")).toHaveValue(
      "zaid@example.com",
    );
    await expect(page.getByTestId("contact-subject")).toHaveValue("Hello");
    await expect(page.getByTestId("contact-message")).toHaveValue(
      "Nice desktop.",
    );
  });

  test("QA happy: valid input -> POST /api/contact 200 -> green success", async ({
    page,
  }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    await openContact(page);
    await fillValidForm(page);
    await page.getByTestId("contact-submit").click();

    await expect(page.getByTestId("contact-success")).toBeVisible();
    await expect(page.getByTestId("contact-success")).toContainText(
      "Message sent",
    );
  });

  test("acceptance failure: network abort shows error + mailto fallback", async ({
    page,
  }) => {
    await page.route("**/api/contact", (route) => route.abort("failed"));

    await openContact(page);
    await fillValidForm(page);
    await page.getByTestId("contact-submit").click();

    await expect(page.getByTestId("contact-error")).toBeVisible();
    await expect(page.getByTestId("contact-error")).toContainText(
      "Network hiccup",
    );
    await expect(page.getByTestId("contact-mailto")).toHaveAttribute(
      "href",
      /^mailto:.*subject=Portfolio%20contact%20from%20Zaid.*body=Nice%20desktop\./,
    );
  });

  test("QA failure: route 501 -> mailto fallback with composed subject/body", async ({
    page,
  }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 501,
        contentType: "application/json",
        body: JSON.stringify({ message: "mailto" }),
      }),
    );

    await openContact(page);
    await fillValidForm(page);
    await page.getByTestId("contact-submit").click();

    await expect(page.getByTestId("contact-error")).toBeVisible();
    await expect(page.getByTestId("contact-mailto")).toHaveAttribute(
      "href",
      /^mailto:owner@zaidx\.me\?subject=Portfolio%20contact%20from%20Zaid&body=Nice%20desktop\./,
    );
  });

  test("QA failure: 429 shows rate-limit message and no mailto", async ({
    page,
  }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: "too fast" }),
      }),
    );

    await openContact(page);
    await fillValidForm(page);
    await page.getByTestId("contact-submit").click();

    await expect(page.getByTestId("contact-error")).toBeVisible();
    await expect(page.getByTestId("contact-error")).toContainText(
      "sending too fast",
    );
    await expect(page.getByTestId("contact-mailto")).not.toBeVisible();
  });
});
