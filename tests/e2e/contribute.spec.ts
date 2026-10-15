import { expect, test } from "@playwright/test";

// Only invalid submissions are sent here, so the suite never writes rows.
// The successful path is covered by tests/integration/database.test.ts.

test("invalid submissions show accessible errors and keep input", async ({ page }) => {
  await page.goto("/contribute");
  await page.getByLabel("Name of the place").fill("Hidden falls");
  await page.getByLabel("Why should travellers know about it?").fill("Too short");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Send suggestion" }).click();

  // Scoped to the form: Next.js also renders a route-announcer alert.
  const summary = page.locator("form").getByRole("alert");
  await expect(summary).toContainText("Please check the highlighted fields.");
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("link")).toHaveCount(3);

  const description = page.getByLabel("Why should travellers know about it?");
  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expect(description).toHaveValue("Too short");
  await expect(page.getByLabel("Name of the place")).toHaveValue("Hidden falls");

  // Summary links move focus to the field.
  await summary.getByRole("link", { name: /at least 30 characters/ }).click();
  await expect(description).toBeFocused();
});
