import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("renders every section with a single h1", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 1, name: "Discover the Nepal beyond the ordinary." }),
    ).toBeVisible();

    for (const name of [
      "Five ways into the country",
      "Places worth the detour",
      "Lesser-known places, told properly",
      "Seven provinces, from the Terai to the high Himalaya",
      "Every season opens a different Nepal",
      "Travel lightly, leave something good behind",
      "Know a place the guidebooks missed?",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
  });

  test("shows the five experience themes", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#experiences");
    for (const label of ["Nature", "Culture", "Adventure", "Villages", "Food"]) {
      await expect(section.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await section.getByRole("link", { name: "Nature", exact: true }).click();
    await expect(page).toHaveURL(/\/explore\?theme=nature$/);
    await expect(page.getByRole("heading", { level: 2, name: "Nature" })).toBeVisible();
  });

  test("search submits to /explore with filters", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("search", { name: "Search destinations" });
    await search.getByLabel("Where to?").fill("lake");
    await search.getByLabel("Experience").selectOption("lakes");
    await search.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/explore\?q=lake&category=lakes/);
    await expect(page.getByRole("heading", { level: 2, name: "Himalayan lakes" })).toBeVisible();
    await expect(page.getByLabel("Where to?")).toHaveValue("lake");
  });

  test("province and season links lead to filtered explore pages", async ({ page }) => {
    await page.goto("/");
    await page.locator("#provinces").getByRole("link", { name: "Karnali" }).click();
    await expect(page).toHaveURL(/\/explore\?region=karnali$/);
    await expect(
      page.getByRole("navigation", { name: "Filter by province" }).getByRole("link", { name: "Karnali" }),
    ).toHaveAttribute("aria-current", "true");

    await page.goto("/");
    await page.locator("#seasons").getByRole("link", { name: "Autumn" }).click();
    await expect(page).toHaveURL(/\/explore\?season=autumn$/);
    await expect(page.getByRole("heading", { level: 2, name: "Destinations for autumn" })).toBeVisible();
  });

  test("every internal link resolves", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) => [
        ...new Set(links.map((a) => a.getAttribute("href")!.split("#")[0] || "/")),
      ]);
    expect(hrefs.length).toBeGreaterThan(10);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test("community call to action opens the suggestion form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Suggest a place" }).last().click();
    await expect(page).toHaveURL(/\/contribute$/);
    await expect(page.getByRole("heading", { level: 1, name: "Suggest a place" })).toBeVisible();
  });
});

test("unknown routes show the designed 404", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This trail doesn’t go anywhere");
});
