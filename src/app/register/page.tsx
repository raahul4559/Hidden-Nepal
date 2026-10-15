import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { RegisterForm } from "@/features/auth/components/register-form";
import { safeNextPath } from "@/features/auth/validation";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
};

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Create an account"
        intro="Keep a list of the places you want to visit."
      />
      <div className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-md">
          <Suspense>
            <RegisterContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

async function RegisterContent({ searchParams }: Pick<PageProps<"/register">, "searchParams">) {
  const { next } = await searchParams;
  return <RegisterForm next={safeNextPath(Array.isArray(next) ? next[0] : next)} />;
}
