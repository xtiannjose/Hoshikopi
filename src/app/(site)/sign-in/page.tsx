import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ArrowsClockwiseIcon,
  CakeIcon,
  HeartIcon,
  StarIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { IconCircle, Panel } from "@/components/panel";
import { googleEnabled, safeNext } from "@/modules/identity";
import { canEmail } from "@/modules/notify";

import { googleSignInAction } from "./actions";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

const PERKS = [
  {
    // The page's one gold star (docs/05 section 1).
    icon: <StarIcon size={20} weight="fill" className="text-star" />,
    text: "Each drink lights a Star. Nine make a free cup.",
  },
  { icon: <HeartIcon size={20} />, text: "Save your usual as a Favourite." },
  { icon: <ArrowsClockwiseIcon size={20} />, text: "Order again in one tap." },
  {
    icon: <CakeIcon size={20} />,
    text: "A drink on us in your birthday month.",
  },
];

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="grid content-start gap-6">
          <PageHeader
            back={
              <Suspense
                fallback={<BackLink href="/">Back to Hoshikopi</BackLink>}
              >
                <Back searchParams={searchParams} />
              </Suspense>
            }
            title="Sign in"
            intro={
              canEmail()
                ? "No password. We email you a link, you tap it, you're in. New here? The same link makes your account."
                : "No password. This demo sends no emails, so continue with Google below. New here? That makes your account."
            }
          />
          <Suspense fallback={<div className="min-h-40" />}>
            <Form searchParams={searchParams} />
          </Suspense>
        </div>
        <Panel
          id="why-sign-in"
          title="Why sign in"
          icon={<UserCircleIcon size={20} />}
        >
          <ul className="grid gap-4">
            {PERKS.map((perk) => (
              <li key={perk.text} className="flex items-center gap-3">
                <IconCircle>{perk.icon}</IconCircle>
                {perk.text}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}

type Search = { searchParams: PageProps<"/sign-in">["searchParams"] };

/** Back to where the Customer came from, never to a members-only page. */
async function Back({ searchParams }: Search) {
  const { next } = await searchParams;
  const target = safeNext(typeof next === "string" ? next : null);
  return target === "/checkout" || target === "/cart" ? (
    <BackLink href={target}>Order as a guest instead</BackLink>
  ) : (
    <BackLink href="/">Back to Hoshikopi</BackLink>
  );
}

async function Form({ searchParams }: Search) {
  const { next, out } = await searchParams;
  const target = safeNext(typeof next === "string" ? next : null);
  return (
    <div className="grid gap-6">
      {out === "1" && (
        <p aria-live="polite" className="bg-muted rounded-card p-4">
          You&apos;re signed out. Salamat, see you at the counter!
        </p>
      )}
      {googleEnabled() && (
        <>
          <form action={googleSignInAction}>
            <input type="hidden" name="next" value={target} />
            <button
              type="submit"
              className="border-input min-h-12 w-full rounded-full border px-6 font-semibold"
            >
              Continue with Google
            </button>
          </form>
          <p className="text-muted-foreground text-center text-sm">or</p>
        </>
      )}
      <SignInForm next={target} />
    </div>
  );
}
