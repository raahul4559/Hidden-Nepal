import { expect, test } from "@playwright/test";

test("mobile menu opens and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile navigation is only shown below the md breakpoint.");

  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  const menu = page.getByRole("navigation", { name: "Main" });
  await expect(menu.getByRole("link", { name: "Suggest a place" })).toBeVisible();
  await menu.getByRole("link", { name: "Explore" }).click();
  await expect(page).toHaveURL(/\/explore$/);
});
