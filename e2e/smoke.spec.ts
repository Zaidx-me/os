import { expect, test } from "@playwright/test";

test("landing page serves HTTP 200 and renders the default page content", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  // Content actually present in the current create-next-app default page.
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toContainText("To get started, edit the");
  await expect(heading).toContainText("page.tsx");

  await expect(page.getByRole("link", { name: "Templates" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Learning" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Deploy Now" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Documentation" })).toBeVisible();
});
