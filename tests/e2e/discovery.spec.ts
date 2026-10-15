import { expect, test } from "@playwright/test";

const canonical = (page: import("@playwright/test").Page) =>
  page.locator('link[rel="canonical"]').getAttribute("href");

test.describe("explore", () => {
  test("filters apply via the form, show as removable chips and are shareable", async ({ page }) => {
    await page.goto("/explore");
    await page.getByLabel("Province").selectOption("karnali");
    await page.getByLabel("Sort by").selectOption("name");
    await page.getByRole("button", { name: "Apply filters" }).click();

    await expect(page).toHaveURL(/region=karnali/);
    await expect(page).toHaveURL(/sort=name/);
    const chips = page.getByRole("list", { name: "Active filters" });
    await expect(chips.getByRole("link", { name: /Karnali/ })).toBeVisible();

    // Reloading the shared URL restores the same state.
    await page.reload();
    await expect(page.getByLabel("Province")).toHaveValue("karnali");

    await chips.getByRole("link", { name: /Karnali/ }).click();
    await expect(page).not.toHaveURL(/region=/);
  });

  test("invalid parameters are ignored, not errors", async ({ page }) => {
    const res = await page.goto("/explore?page=abc&sort=random&difficulty=extreme&district=%3Cscript%3E&region=atlantis");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 2, name: "All destinations" })).toBeVisible();
    expect(await canonical(page)).toMatch(/\/explore$/);
  });

  test("practical filters explain they need verified details", async ({ page }) => {
    await page.goto("/explore?difficulty=easy");
    await expect(page.getByRole("note")).toContainText("only include destinations whose practical details");
  });

  test("an out-of-range page offers a way back", async ({ page }) => {
    await page.goto("/explore?page=50");
    const backLink = page.getByRole("link", { name: "Go to page 1" });
    const empty = page.getByText("No destinations published yet");
    await expect(backLink.or(empty)).toBeVisible();
  });

  test("keyword searches are not indexed", async ({ page }) => {
    await page.goto("/explore?q=lake");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("provinces", () => {
  test("index lists all seven provinces", async ({ page }) => {
    await page.goto("/provinces");
    const main = page.getByRole("main");
    for (const name of ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"]) {
      await expect(main.getByRole("link", { name, exact: true })).toBeVisible();
    }
  });

  test("province pages have their own title, canonical and neighbours", async ({ page }) => {
    await page.goto("/provinces/karnali");
    await expect(page).toHaveTitle(/Karnali Province/);
    expect(await canonical(page)).toMatch(/\/provinces\/karnali$/);
    await expect(page.getByRole("heading", { level: 2, name: "Destinations in Karnali" })).toBeVisible();
    const others = page.getByRole("navigation", { name: "Other provinces" });
    await expect(others.getByRole("link", { name: "Lumbini" })).toBeVisible();
    await expect(others.getByRole("link", { name: "Sudurpashchim" })).toBeVisible();
  });

  test("unknown provinces show a not-found page that is not indexed", async ({ page }) => {
    await page.goto("/provinces/atlantis");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("isn’t one of them");
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });
});

test.describe("SEO files", () => {
  test("robots.txt points to the sitemap", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });

  test("sitemap lists provinces and no sample destinations", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("/provinces/karnali");
    expect(xml).toContain("/explore");
    // The seeded samples are noindex, so they must not be advertised.
    expect(xml).not.toContain("/destinations/rara-lake");
  });
});

test("destination pages declare a canonical URL", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#featured [role=status]")).toHaveCount(0);
  const link = page.locator("#featured article").first().getByRole("heading").getByRole("link");
  test.skip((await link.count()) === 0, "No published featured destinations in this database.");
  // Load directly: after client navigation the previous page's tags may linger.
  await page.goto((await link.getAttribute("href"))!);
  expect(await canonical(page)).toMatch(/\/destinations\/[a-z0-9-]+$/);
});
