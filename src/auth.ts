import "server-only";

import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { checkCredentials } from "@/features/auth/credentials";

/**
 * Auth.js configuration.
 *
 * Sessions are encrypted JWT cookies (Credentials sign-in requires the JWT
 * strategy). The token holds only the user id and `sessionVersion`; the role
 * is never stored in it. `src/features/auth/session.ts` loads the user from
 * the database on every request, so role changes apply immediately and
 * bumping `sessionVersion` revokes every outstanding session.
 *
 * Cookies use Auth.js defaults: HttpOnly, SameSite=Lax, and `Secure` with the
 * `__Secure-` prefix whenever the site is served over HTTPS.
 */

declare module "next-auth" {
  interface User {
    sessionVersion?: number;
  }
  interface Session {
    user: { id: string } & DefaultSession["user"];
    sessionVersion?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    sv?: number;
  }
}

/** `code` reaches the sign-in Server Action, so the form can explain why. */
class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}
class UnavailableSignin extends CredentialsSignin {
  code = "unavailable";
}

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS, updateAge: 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const result = await checkCredentials(credentials, request.headers);
        switch (result.status) {
          case "ok":
            return { id: result.user.id, sessionVersion: result.user.sessionVersion };
          case "rate_limited":
            throw new RateLimitedSignin();
          case "unavailable":
            throw new UnavailableSignin();
          default:
            return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Fresh sign-in: keep the token minimal.
        return { sub: user.id, sv: user.sessionVersion ?? 0 };
      }
      return token;
    },
    session({ session, token }) {
      // Only the id is exposed (also via /api/auth/session). Role, email and
      // name come from the database through getCurrentUser().
      return {
        expires: session.expires,
        user: { id: token.sub ?? "" },
        sessionVersion: token.sv,
      } as typeof session;
    },
  },
  logger: {
    // Failed sign-ins are expected; don't log stack traces for them.
    error(error) {
      if (error instanceof CredentialsSignin) return;
      console.error(`[auth] ${error.name}: ${error.message}`);
    },
  },
});
