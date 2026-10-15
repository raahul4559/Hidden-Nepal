import { expect, test } from "@playwright/test";

// Read-only by default, like the rest of the suite. The full account flow
// creates a user, so it only runs with E2E_DB_WRITES=1 against a disposable
// database (see README → Authentication → Tests).

test.describe("protected areas", () => {
  for (const path of ["/account", "/admin"]) {
    test(`${path} sends signed-out visitors to sign in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
      await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    });
  }

  test("user API rejects signed-out requests", async ({ request }) => {
    const res = await request.get("/api/me/saved-destinations");
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "Sign in required" });
  });

  test("admin API rejects cross-site requests before anything else", async ({ request }) => {
    const res = await request.patch("/api/admin/users/someone/role", {
      headers: { origin: "https://evil.example" },
      data: { role: "ADMIN" },
    });
    expect(res.status()).toBe(403);
  });
});

test("invalid sign-in input shows accessible errors and never refills the password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("secret value");
  await page.getByRole("button", { name: "Sign in" }).click();

  const alert = page.locator("form").getByRole("alert");
  await expect(alert).toContainText("Please check the highlighted fields.");
  await expect(alert).toBeFocused();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
  await expect(page.getByLabel("Password")).toHaveValue("");
});

test.describe("account flow (writes to the database)", () => {
  test.skip(!process.env.E2E_DB_WRITES, "Set E2E_DB_WRITES=1 with a disposable DATABASE_URL.");
  test.describe.configure({ mode: "serial" });

  test("register, save a destination, and sign out", async ({ page }, testInfo) => {
    const email = `e2e-${testInfo.project.name}-${Date.now()}@example.com`;
    const password = "a long enough e2e password";

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Repeat password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/account");
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText("Traveller")).toBeVisible();

    // Ordinary users can't see the admin area.
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Users and roles" })).toHaveCount(0);

    await page.goto("/destinations/rara-lake");
    await page.getByRole("button", { name: "Save destination" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");

    await page.goto("/account");
    await expect(page.getByRole("link", { name: "Rara Lake" })).toBeVisible();

    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/account");
    await expect(page).toHaveURL("/login?next=%2Faccount");

    // Wrong password: generic message, no hint about which part was wrong.
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("not the password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("Incorrect email or password.");
  });
});
