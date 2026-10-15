// @vitest-environment node
/**
 * Authentication and authorization against a real PostgreSQL database
 * (TEST_DATABASE_URL, name ending in _test). Skipped without it.
 *
 * Only the Auth.js session lookup is mocked: `auth()` returns whatever
 * session a test sets, which is exactly what a valid signed cookie would
 * yield. Everything after that (database lookups, role checks, ownership
 * scoping, Server Actions, Route Handlers) runs for real.
 */
import "dotenv/config";

import { execFileSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";
import { CredentialsSignin } from "next-auth";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => {
  // Point the app's db client at the test database before anything imports it.
  if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  return {
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    headers: new Headers({ "x-forwarded-for": "203.0.113.1" }),
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth, signIn: mocks.signIn, signOut: mocks.signOut }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
// Request-scope helpers have no request to attach to in a test.
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const url = process.env.TEST_DATABASE_URL;
const ORIGIN = "http://localhost:3000";

type TestUser = { id: string; email: string; sessionVersion: number };

describe.skipIf(!url)("authentication and authorization (integration)", () => {
  let prisma: PrismaClient;
  let alice: TestUser;
  let bob: TestUser;
  let admin: TestUser;

  // App modules are imported lazily, after DATABASE_URL points at the test DB.
  const session = () => import("@/features/auth/session");
  const authActions = () => import("@/features/auth/actions");
  const savedActions = () => import("@/features/saved/actions");
  const adminActions = () => import("@/features/admin/actions");
  const savedRoute = () => import("@/app/api/me/saved-destinations/route");
  const roleRoute = () => import("@/app/api/admin/users/[id]/role/route");

  function signedInAs(user: TestUser | null) {
    mocks.auth.mockResolvedValue(
      user ? { user: { id: user.id }, sessionVersion: user.sessionVersion, expires: "2099-01-01T00:00:00Z" } : null,
    );
  }

  function form(fields: Record<string, string>) {
    const data = new FormData();
    for (const [k, v] of Object.entries(fields)) data.set(k, v);
    return data;
  }

  function apiRequest(path: string, method: string, body?: unknown, headers: Record<string, string> = {}) {
    return new Request(`${ORIGIN}${path}`, {
      method,
      headers: { host: "localhost:3000", origin: ORIGIN, "content-type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  const roleCtx = (id: string) => ({ params: Promise.resolve({ id }) });

  async function makeUser(email: string, role: "USER" | "ADMIN" = "USER", password = "correct horse battery"): Promise<TestUser> {
    const { hashPassword } = await import("@/features/auth/password");
    return prisma.user.create({
      data: { email, role, passwordHash: await hashPassword(password) },
      select: { id: true, email: true, sessionVersion: true },
    });
  }

  async function savedSlugs(user: TestUser) {
    const rows = await prisma.savedDestination.findMany({
      where: { userId: user.id },
      select: { destination: { select: { slug: true } } },
    });
    return rows.map((r) => r.destination.slug).sort();
  }

  async function roleOf(user: TestUser) {
    return (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).role;
  }

  /** Server-side redirect()/notFound() throw errors whose digest names the target. */
  async function interruption(promise: Promise<unknown>) {
    try {
      await promise;
    } catch (error) {
      return String((error as { digest?: string }).digest ?? error);
    }
    return "no interruption";
  }

  beforeAll(async () => {
    const dbName = new URL(url!).pathname.slice(1);
    if (!dbName.endsWith("_test")) throw new Error(`TEST_DATABASE_URL must end in _test (got "${dbName}").`);
    execFileSync("npx", ["prisma", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });

    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });
    await prisma.$executeRawUnsafe('TRUNCATE "User", "SavedDestination", "RateLimit" CASCADE');

    const { seedDatabase } = await import("../../prisma/seed/index");
    const { upsertDestination } = await import("../../prisma/seed/destinations");
    await seedDatabase(prisma, { samples: false });
    const base = {
      summary: "Integration-test destination for saved places.",
      regionSlug: "koshi" as const,
      categorySlugs: ["villages" as const],
      practicalInfo: { status: "UNVERIFIED" as const },
    };
    await upsertDestination(prisma, { ...base, slug: "auth-place-one", name: "Auth Place One", status: "PUBLISHED", publishedAt: new Date() });
    await upsertDestination(prisma, { ...base, slug: "auth-place-two", name: "Auth Place Two", status: "PUBLISHED", publishedAt: new Date() });
    await upsertDestination(prisma, { ...base, slug: "auth-place-draft", name: "Auth Place Draft", status: "DRAFT" });

    alice = await makeUser("alice@example.com");
    bob = await makeUser("bob@example.com");
    admin = await makeUser("admin@example.com", "ADMIN");
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  beforeEach(() => {
    signedInAs(null);
    mocks.signIn.mockReset();
    mocks.signOut.mockReset();
  });

  // ─── 1. Unauthenticated visitors ──────────────────────────────────────────

  describe("unauthenticated visitors", () => {
    it("are redirected away from protected pages", async () => {
      const { requireUser, requireAdminPage, getCurrentUser } = await session();
      expect(await getCurrentUser()).toBeNull();
      expect(await interruption(requireUser("/account"))).toMatch(/NEXT_REDIRECT.*\/login\?next=%2Faccount/);
      expect(await interruption(requireAdminPage("/admin"))).toMatch(/NEXT_REDIRECT.*\/login\?next=%2Fadmin/);
    });

    it("cannot call user Server Actions", async () => {
      const { toggleSavedDestination } = await savedActions();
      const { updateProfile } = await authActions();

      const saved = await toggleSavedDestination({ status: "idle", saved: false }, form({ slug: "auth-place-one", intent: "save" }));
      expect(saved).toMatchObject({ status: "error", message: "Sign in required" });
      expect(await prisma.savedDestination.count()).toBe(0);

      const profile = await updateProfile({ status: "idle" }, form({ name: "Mallory" }));
      expect(profile).toMatchObject({ status: "error", message: "Sign in required" });
    });

    it("get 401 from user and admin Route Handlers", async () => {
      const { GET, POST, DELETE } = await savedRoute();
      const { PATCH } = await roleRoute();
      expect((await GET()).status).toBe(401);
      expect((await POST(apiRequest("/api/me/saved-destinations", "POST", { slug: "auth-place-one" }))).status).toBe(401);
      expect((await DELETE(apiRequest("/api/me/saved-destinations", "DELETE", { slug: "auth-place-one" }))).status).toBe(401);
      const res = await PATCH(apiRequest(`/api/admin/users/${alice.id}/role`, "PATCH", { role: "ADMIN" }), roleCtx(alice.id));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Sign in required" });
      expect(await roleOf(alice)).toBe("USER");
    });

    it("are treated as signed out when the session names a deleted or unknown user", async () => {
      const { getCurrentUser } = await session();
      signedInAs({ id: "does-not-exist", email: "", sessionVersion: 0 });
      expect(await getCurrentUser()).toBeNull();
    });
  });

  // ─── 2. Ordinary users and admin operations ───────────────────────────────

  describe("ordinary users", () => {
    it("get a 404 from admin pages and 403 from admin checks", async () => {
      signedInAs(alice);
      const { requireAdminPage, assertAdmin } = await session();
      expect(await interruption(requireAdminPage("/admin"))).toMatch(/NEXT_HTTP_ERROR_FALLBACK;404/);
      await expect(assertAdmin()).rejects.toMatchObject({ status: 403 });
    });

    it("cannot change roles through the admin Server Action", async () => {
      signedInAs(alice);
      const { changeUserRole } = await adminActions();
      const result = await changeUserRole({ status: "idle" }, form({ userId: bob.id, role: "ADMIN" }));
      expect(result).toEqual({ status: "error", message: "You don’t have permission to do that" });
      expect(await roleOf(bob)).toBe("USER");
    });

    it("cannot change roles through the admin Route Handler", async () => {
      signedInAs(alice);
      const { PATCH } = await roleRoute();
      const res = await PATCH(apiRequest(`/api/admin/users/${bob.id}/role`, "PATCH", { role: "ADMIN" }), roleCtx(bob.id));
      expect(res.status).toBe(403);
      expect(await roleOf(bob)).toBe("USER");
    });

    it("cannot list users through the admin service, even if a caller forgets the page guard", async () => {
      const { listUsers, setUserRole } = await import("@/features/admin/users");
      const fakeActor = { id: alice.id, email: alice.email, name: null, role: "USER" as const };
      await expect(listUsers(fakeActor)).rejects.toMatchObject({ status: 403 });
      await expect(setUserRole(fakeActor, bob.id, "ADMIN")).rejects.toMatchObject({ status: 403 });
    });

    it("lose admin access immediately when demoted, because the role is read from the database", async () => {
      const temp = await makeUser("demoted@example.com", "ADMIN");
      signedInAs(temp);
      const { assertAdmin } = await session();
      await expect(assertAdmin()).resolves.toMatchObject({ id: temp.id });

      await prisma.user.update({ where: { id: temp.id }, data: { role: "USER" } });
      await expect(assertAdmin()).rejects.toMatchObject({ status: 403 });
    });

    it("admins can change other users' roles", async () => {
      const target = await makeUser("promote-me@example.com");
      signedInAs(admin);
      const { PATCH } = await roleRoute();
      const res = await PATCH(apiRequest(`/api/admin/users/${target.id}/role`, "PATCH", { role: "EDITOR" }), roleCtx(target.id));
      expect(res.status).toBe(200);
      expect(await roleOf(target)).toBe("EDITOR");

      const { changeUserRole } = await adminActions();
      expect(await changeUserRole({ status: "idle" }, form({ userId: target.id, role: "USER" }))).toMatchObject({ status: "ok" });
      expect(await roleOf(target)).toBe("USER");
    });
  });

  // ─── 3. Other users' records ──────────────────────────────────────────────

  describe("ownership", () => {
    it("saves are idempotent and limited to published destinations", async () => {
      signedInAs(alice);
      const { toggleSavedDestination } = await savedActions();
      const save = (slug: string) => toggleSavedDestination({ status: "idle", saved: false }, form({ slug, intent: "save" }));

      expect(await save("auth-place-one")).toEqual({ status: "ok", saved: true });
      expect(await save("auth-place-one")).toEqual({ status: "ok", saved: true });
      expect(await savedSlugs(alice)).toEqual(["auth-place-one"]);

      expect(await save("auth-place-draft")).toMatchObject({ status: "error" });
      expect(await save("no-such-place")).toMatchObject({ status: "error" });
      expect(await save("../../etc")).toMatchObject({ status: "error" });
      expect(await savedSlugs(alice)).toEqual(["auth-place-one"]);

      const { POST } = await savedRoute();
      expect((await POST(apiRequest("/api/me/saved-destinations", "POST", { slug: "auth-place-one" }))).status).toBe(201);
      expect((await POST(apiRequest("/api/me/saved-destinations", "POST", { slug: "auth-place-draft" }))).status).toBe(404);
      expect(await prisma.savedDestination.count({ where: { userId: alice.id } })).toBe(1);
    });

    it("a user cannot remove another user's saved destination", async () => {
      signedInAs(alice);
      const { toggleSavedDestination } = await savedActions();
      await toggleSavedDestination({ status: "idle", saved: false }, form({ slug: "auth-place-two", intent: "save" }));
      const before = await savedSlugs(alice);

      // Bob forges Alice's id in both the form and the JSON body.
      signedInAs(bob);
      await toggleSavedDestination(
        { status: "idle", saved: true },
        form({ slug: "auth-place-two", intent: "remove", userId: alice.id }),
      );
      const { DELETE, GET } = await savedRoute();
      const res = await DELETE(
        apiRequest("/api/me/saved-destinations", "DELETE", { slug: "auth-place-one", userId: alice.id }),
      );
      expect(res.status).toBe(200);

      expect(await savedSlugs(alice)).toEqual(before);
      expect(await (await GET()).json()).toEqual({ saved: [] });
    });

    it("a user cannot save into another user's list", async () => {
      signedInAs(bob);
      const { toggleSavedDestination } = await savedActions();
      await toggleSavedDestination(
        { status: "idle", saved: false },
        form({ slug: "auth-place-two", intent: "save", userId: alice.id }),
      );
      expect(await savedSlugs(bob)).toEqual(["auth-place-two"]);
      expect(await prisma.savedDestination.count({ where: { userId: alice.id, destination: { slug: "auth-place-two" } } })).toBe(1);
    });

    it("profile updates only ever change the signed-in user", async () => {
      signedInAs(bob);
      const { updateProfile } = await authActions();
      const result = await updateProfile({ status: "idle" }, form({ name: "Bob B.", userId: alice.id, email: "x@example.com" }));
      expect(result).toEqual({ status: "success", message: "Profile saved." });

      const [a, b] = await Promise.all([
        prisma.user.findUniqueOrThrow({ where: { id: alice.id } }),
        prisma.user.findUniqueOrThrow({ where: { id: bob.id } }),
      ]);
      expect(a.name).toBeNull();
      expect(b).toMatchObject({ name: "Bob B.", email: "bob@example.com" });
    });

    it("deleting a user removes their saves", async () => {
      const temp = await makeUser("cascade@example.com");
      signedInAs(temp);
      const { toggleSavedDestination } = await savedActions();
      await toggleSavedDestination({ status: "idle", saved: false }, form({ slug: "auth-place-one", intent: "save" }));
      await prisma.user.delete({ where: { id: temp.id } });
      expect(await prisma.savedDestination.count({ where: { userId: temp.id } })).toBe(0);
    });
  });

  // ─── 4. Self-promotion ────────────────────────────────────────────────────

  describe("privilege escalation", () => {
    it("registration ignores a submitted role", async () => {
      const { register } = await authActions();
      await register(
        { status: "idle" },
        form({
          email: "Eve@Example.com",
          password: "a long enough password",
          confirmPassword: "a long enough password",
          role: "ADMIN",
          sessionVersion: "5",
        }),
      );
      const eve = await prisma.user.findUniqueOrThrow({ where: { email: "eve@example.com" } });
      expect(eve).toMatchObject({ role: "USER", sessionVersion: 0, emailVerified: null });
      // Signed in straight after registering, to the safe default page.
      expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
        email: "eve@example.com",
        password: "a long enough password",
        redirectTo: "/account",
      });
    });

    it("profile updates ignore a submitted role", async () => {
      signedInAs(alice);
      const { updateProfile } = await authActions();
      await updateProfile({ status: "idle" }, form({ name: "Alice", role: "ADMIN" }));
      expect(await roleOf(alice)).toBe("USER");
    });

    it("a user cannot promote themselves through the admin Route Handler or Server Action", async () => {
      signedInAs(alice);
      const { PATCH } = await roleRoute();
      const res = await PATCH(apiRequest(`/api/admin/users/${alice.id}/role`, "PATCH", { role: "ADMIN" }), roleCtx(alice.id));
      expect(res.status).toBe(403);

      const { changeUserRole } = await adminActions();
      expect(await changeUserRole({ status: "idle" }, form({ userId: alice.id, role: "ADMIN" }))).toMatchObject({
        status: "error",
      });
      expect(await roleOf(alice)).toBe("USER");
    });

    it("an admin cannot change their own role", async () => {
      signedInAs(admin);
      const { PATCH } = await roleRoute();
      const res = await PATCH(apiRequest(`/api/admin/users/${admin.id}/role`, "PATCH", { role: "USER" }), roleCtx(admin.id));
      expect(res.status).toBe(409);
      expect(await roleOf(admin)).toBe("ADMIN");
    });

    it("rejects unknown roles", async () => {
      const target = await makeUser("role-probe@example.com");
      signedInAs(admin);
      const { PATCH } = await roleRoute();
      const res = await PATCH(apiRequest(`/api/admin/users/${target.id}/role`, "PATCH", { role: "SUPERUSER" }), roleCtx(target.id));
      expect(res.status).toBe(400);
      expect(await roleOf(target)).toBe("USER");
    });

    it("the bootstrap script grants and revokes admin for existing accounts only", async () => {
      const { setAdminByEmail } = await import("../../scripts/admin-role");
      const target = await makeUser("first-admin@example.com");

      await expect(setAdminByEmail(prisma, "nobody@example.com", true)).rejects.toThrow(/No account/);
      expect(await setAdminByEmail(prisma, " First-Admin@Example.com ", true)).toMatchObject({ role: "ADMIN" });
      expect(await roleOf(target)).toBe("ADMIN");

      await setAdminByEmail(prisma, "first-admin@example.com", false);
      const after = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
      expect(after).toMatchObject({ role: "USER", sessionVersion: 1 }); // old sessions revoked
    });
  });

  // ─── 5. Invalid authentication requests ──────────────────────────────────

  describe("invalid authentication requests", () => {
    const headersFrom = (ip: string) => new Headers({ "x-forwarded-for": ip });

    it("stores only scrypt hashes, never the password", async () => {
      const row = await prisma.user.findUniqueOrThrow({ where: { id: alice.id } });
      expect(row.passwordHash).toMatch(/^scrypt\$131072\$8\$1\$/);
      expect(row.passwordHash).not.toContain("correct horse battery");
      await expect(
        prisma.user.update({ where: { id: alice.id }, data: { passwordHash: "plaintext" } }),
      ).rejects.toThrow(/User_password_hash_format/);
    });

    it("accepts correct credentials and returns only id and session version", async () => {
      const { checkCredentials } = await import("@/features/auth/credentials");
      const result = await checkCredentials(
        { email: "  ALICE@example.com ", password: "correct horse battery" },
        headersFrom("198.51.100.1"),
      );
      expect(result).toEqual({ status: "ok", user: { id: alice.id, sessionVersion: 0 } });
    });

    it("gives the same answer for a wrong password and an unknown email", async () => {
      const { checkCredentials } = await import("@/features/auth/credentials");
      const ip = headersFrom("198.51.100.2");
      expect(await checkCredentials({ email: "bob@example.com", password: "wrong password!" }, ip)).toEqual({ status: "invalid" });
      expect(await checkCredentials({ email: "ghost@example.com", password: "wrong password!" }, ip)).toEqual({ status: "invalid" });
    });

    it("rejects malformed input without touching the database", async () => {
      const { checkCredentials } = await import("@/features/auth/credentials");
      const ip = headersFrom("198.51.100.3");
      const countersBefore = await prisma.rateLimit.count();
      for (const raw of [
        undefined,
        {},
        { email: "bob@example.com" },
        { email: ["bob@example.com"], password: "x" },
        { email: "not-an-email", password: "whatever" },
        { email: "bob@example.com", password: "x".repeat(10_000) },
        { email: "bob@example.com' OR 1=1 --", password: "x" },
      ]) {
        expect(await checkCredentials(raw, ip)).toEqual({ status: "invalid" });
      }
      expect(await prisma.rateLimit.count()).toBe(countersBefore);
    });

    it("rate-limits repeated attempts on one account, even with the right password", async () => {
      const victim = await makeUser("victim@example.com");
      const { checkCredentials } = await import("@/features/auth/credentials");
      for (let i = 0; i < 5; i++) {
        // Different addresses: the per-email limit holds regardless of IP.
        expect(await checkCredentials({ email: victim.email, password: "guess number " + i }, headersFrom(`192.0.2.${i}`))).toEqual({
          status: "invalid",
        });
      }
      const blocked = await checkCredentials({ email: victim.email, password: "correct horse battery" }, headersFrom("192.0.2.99"));
      expect(blocked).toMatchObject({ status: "rate_limited" });
      expect(blocked.status === "rate_limited" && blocked.retryAfterSeconds).toBeGreaterThan(800);

      // No email or IP is stored in clear.
      const keys = (await prisma.rateLimit.findMany()).map((r) => r.key);
      expect(keys.every((k) => /^[0-9a-f]{64}$/.test(k))).toBe(true);
    });

    it("the sign-in action validates input and never echoes the password", async () => {
      const { login } = await authActions();
      const result = await login({ status: "idle" }, form({ email: "nope", password: "", next: "https://evil.example" }));
      expect(result).toMatchObject({
        status: "error",
        fieldErrors: { email: "Enter a valid email address", password: "Enter your password" },
        values: { email: "nope" },
      });
      expect(result.status === "error" && Object.keys(result.values)).toEqual(["email"]);
      expect(mocks.signIn).not.toHaveBeenCalled();
    });

    it("the sign-in action reports bad credentials and rate limits generically, and only redirects on-site", async () => {
      const { login } = await authActions();
      const attempt = () =>
        login({ status: "idle" }, form({ email: "bob@example.com", password: "wrong password", next: "//evil.example/x" }));

      mocks.signIn.mockRejectedValueOnce(new CredentialsSignin());
      expect(await attempt()).toMatchObject({ status: "error", message: "Incorrect email or password." });
      expect(mocks.signIn).toHaveBeenLastCalledWith("credentials", expect.objectContaining({ redirectTo: "/account" }));

      const limited = new CredentialsSignin();
      limited.code = "rate_limited";
      mocks.signIn.mockRejectedValueOnce(limited);
      expect(await attempt()).toMatchObject({ message: expect.stringMatching(/Too many sign-in attempts/) });
    });

    it("registration rejects weak, mismatched and duplicate input", async () => {
      const { register } = await authActions();
      mocks.headers = new Headers({ "x-forwarded-for": "203.0.113.50" });

      const weak = await register({ status: "idle" }, form({ email: "new@example.com", password: "short", confirmPassword: "short" }));
      expect(weak).toMatchObject({ fieldErrors: { password: "Use at least 10 characters" } });

      const mismatch = await register(
        { status: "idle" },
        form({ email: "new@example.com", password: "long enough one", confirmPassword: "long enough two" }),
      );
      expect(mismatch).toMatchObject({ fieldErrors: { confirmPassword: "Passwords don’t match" } });

      const duplicate = await register(
        { status: "idle" },
        form({ email: "ALICE@example.com", password: "long enough one", confirmPassword: "long enough one" }),
      );
      expect(duplicate).toMatchObject({ fieldErrors: { email: expect.stringMatching(/already exists/) } });
      expect(await prisma.user.count({ where: { email: "new@example.com" } })).toBe(0);
    });

    it("registration is rate-limited per client address", async () => {
      const { register } = await authActions();
      mocks.headers = new Headers({ "x-forwarded-for": "203.0.113.77" });
      const attempt = (n: number) =>
        register(
          { status: "idle" },
          form({ email: `burst${n}@example.com`, password: "long enough password", confirmPassword: "long enough password" }),
        );
      for (let n = 0; n < 5; n++) await attempt(n);
      expect(await attempt(5)).toMatchObject({ status: "error", message: expect.stringMatching(/Too many accounts/) });
      expect(await prisma.user.count({ where: { email: { startsWith: "burst" } } })).toBe(5);
    });

    it("revoking sessions signs out tokens issued earlier", async () => {
      const user = await makeUser("revoke@example.com");
      signedInAs(user);
      const { getCurrentUser } = await session();
      expect(await getCurrentUser()).toMatchObject({ id: user.id, role: "USER" });

      const { logoutEverywhere } = await authActions();
      await logoutEverywhere();
      expect(mocks.signOut).toHaveBeenCalled();
      expect(await getCurrentUser()).toBeNull(); // same old token, now stale
    });

    it("rejects cross-site and non-JSON requests to mutating Route Handlers", async () => {
      signedInAs(alice);
      const { POST } = await savedRoute();
      const crossSite = await POST(
        apiRequest("/api/me/saved-destinations", "POST", { slug: "auth-place-one" }, { origin: "https://evil.example" }),
      );
      expect(crossSite.status).toBe(403);

      const noOrigin = new Request(`${ORIGIN}/api/me/saved-destinations`, {
        method: "POST",
        headers: { host: "localhost:3000", "content-type": "application/json" },
        body: JSON.stringify({ slug: "auth-place-one" }),
      });
      expect((await POST(noOrigin)).status).toBe(403);

      const formPost = await POST(
        apiRequest("/api/me/saved-destinations", "POST", undefined, { "content-type": "application/x-www-form-urlencoded" }),
      );
      expect(formPost.status).toBe(415);

      const malformed = new Request(`${ORIGIN}/api/me/saved-destinations`, {
        method: "POST",
        headers: { host: "localhost:3000", origin: ORIGIN, "content-type": "application/json" },
        body: "{not json",
      });
      const res = await POST(malformed);
      expect(res.status).toBe(400);
      expect(res.headers.get("cache-control")).toBe("no-store");
    });
  });
});
