import type { Metadata } from "next";
import { Suspense } from "react";

import { safeNext } from "@/modules/identity";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main
      id="main"
      className="mx-auto grid w-full max-w-md flex-1 content-start gap-6 px-4 py-16"
    >
      <div className="grid gap-2">
        <h1 className="font-display text-4xl italic">Sign in</h1>
        <p className="text-muted-foreground">
          No password. We email you a link, you tap it, you&apos;re in. New
          here? The same link makes your account.
        </p>
      </div>
      <Suspense fallback={<div className="min-h-40" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({
  searchParams,
}: {
  searchParams: PageProps<"/sign-in">["searchParams"];
}) {
  const { next } = await searchParams;
  return <SignInForm next={safeNext(typeof next === "string" ? next : null)} />;
}
