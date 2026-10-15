import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("renders every section with a single h1", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 1, name: "Discover the Nepal beyond the ordinary." }),
    ).toBeVisible();

    for (const name of [
      "Seven ways into the country",
      "Places worth the detour",
      "Seven provinces, from the Terai to the high Himalaya",
      "Travel lightly, leave something good behind",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
  });

  test("search submits to /explore with filters", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("search", { name: "Search destinations" });
    await search.getByLabel("Where to?").fill("lake");
    await search.getByLabel("Experience").selectOption("lakes");
    await search.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/explore\?q=lake&category=lakes/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Himalayan lakes" }),
    ).toBeVisible();
    await expect(page.getByLabel("Where to?")).toHaveValue("lake");
  });

  test("category and region links lead to filtered explore pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Hidden waterfalls" }).first().click();
    await expect(page).toHaveURL(/\/explore\?category=waterfalls$/);

    await page.goto("/");
    await page.locator("#regions").getByRole("link", { name: "Karnali" }).click();
    await expect(page).toHaveURL(/\/explore\?region=karnali$/);
    await expect(
      page.getByRole("link", { name: "Karnali" }).and(page.locator('[aria-current="true"]')),
    ).toBeVisible();
  });

  test("every internal link resolves", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) => [
        ...new Set(links.map((a) => a.getAttribute("href")!.split("#")[0] || "/")),
      ]);
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });
});

test("unknown routes show the designed 404", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This trail doesn’t go anywhere",
  );
});
