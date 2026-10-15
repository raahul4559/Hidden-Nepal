import { expect, test } from "@playwright/test";

// Data-dependent: runs against whatever DATABASE_URL the server uses. Tests
// that need published destinations skip themselves when there are none.

/** Featured and spotlight sections stream in; wait until their skeletons are gone. */
async function waitForStreamedSections(page: import("@playwright/test").Page) {
  await expect(page.locator("#featured [role=status], #off-the-map [role=status]")).toHaveCount(0);
}

test("featured cards open their detail pages", async ({ page }) => {
  await page.goto("/");
  await waitForStreamedSections(page);
  const cards = page.locator("#featured article");
  test.skip((await cards.count()) === 0, "No published featured destinations in this database.");

  const title = cards.first().getByRole("heading").getByRole("link");
  const name = (await title.textContent())!.trim();
  await title.click();

  await expect(page).toHaveURL(/\/destinations\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Practical information" })).toBeVisible();
});

test("sample destinations are labelled and withhold practical details", async ({ page }) => {
  await page.goto("/");
  await waitForStreamedSections(page);
  const sample = page.locator("article", { hasText: "Sample content" }).first();
  test.skip((await sample.count()) === 0, "No sample destinations in this database.");

  await sample.getByRole("heading").getByRole("link").click();
  await expect(page.getByRole("note").filter({ hasText: "Sample content." })).toBeVisible();
  await expect(page.getByText("We haven’t verified costs, access, elevation")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("unknown destinations show a not-found page", async ({ page }) => {
  await page.goto("/destinations/this-place-does-not-exist");
  await expect(page.getByRole("heading", { level: 1, name: "We couldn’t find that place" })).toBeVisible();
});

test("/destinations redirects to explore", async ({ page }) => {
  await page.goto("/destinations");
  await expect(page).toHaveURL(/\/explore$/);
});
