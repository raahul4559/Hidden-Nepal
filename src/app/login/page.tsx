import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/validation";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <PageHeader eyebrow="Your account" title="Sign in" intro="Save destinations and pick up where you left off." />
      <div className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-md">
          <Suspense>
            <LoginContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function LoginContent({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next));

  // Set by Auth.js when its endpoints are called directly, or by our actions.
  let notice: string | undefined;
  if (first(params.registered)) notice = "Your account was created. Please sign in.";
  else if (first(params.signedOut) === "all") notice = "You’ve been signed out on all devices.";
  else if (first(params.code) === "rate_limited") notice = "Too many sign-in attempts. Please wait 15 minutes and try again.";
  else if (first(params.error)) notice = "We couldn’t sign you in. Check your details and try again.";

  return <LoginForm next={next} notice={notice} />;
}
