import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { OUTLINE_PILL } from "@/components/panel";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { HOLD_MINUTES, signupForGuest } from "@/modules/content";

import { CancelledNote, SignupAnswer } from "./signup-answer";

export const metadata: Metadata = {
  title: "Your Sign-up",
  robots: { index: false },
};

export default function SignupPage(
  props: PageProps<"/events/[slug]/signup/[id]">
) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-3xl">
        <Suspense fallback={<p>Finding your Sign-up...</p>}>
          <Signup {...props} />
        </Suspense>
      </div>
    </main>
  );
}

/** What the email link opens: confirm within HOLD_MINUTES, or cancel (8.7). */
async function Signup({
  params,
  searchParams,
}: PageProps<"/events/[slug]/signup/[id]">) {
  // Per request: the link token, and the hold runs on the clock.
  await connection();
  const { slug, id } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const signup = await signupForGuest(id, token);
  if (signup === "cancelled") {
    return (
      <div className="grid gap-6">
        <PageHeader
          back={<BackLink href={`/events/${slug}`}>Back to the Event</BackLink>}
          title="Your Sign-up"
        />
        <CancelledNote />
      </div>
    );
  }
  if (!signup) notFound();
  // The link's token already proves which Sign-up this is. If the Manager
  // has since changed the Event's address, the emailed link still works and
  // lands on the new one (audit DC-19).
  if (signup.event.slug !== slug) {
    redirect(
      `/events/${signup.event.slug}/signup/${id}?${new URLSearchParams({ t: token })}`
    );
  }
  const { event } = signup;
  const seats = `${signup.seats} ${signup.seats === 1 ? "seat" : "seats"}`;
  return (
    <div className="grid gap-6">
      <PageHeader
        back={<BackLink href={`/events/${slug}`}>{event.title}</BackLink>}
        eyebrow="Your Sign-up"
        title={event.title}
        intro={`${formatDate(event.startsAt)} at ${formatTime(event.startsAt)}, ${seats} for ${signup.name}. ${
          event.priceCents
            ? `Pay ${formatPrice(event.priceCents)} a seat at the door.`
            : "It's free. Just come by."
        }`}
      />
      {signup.expired ? (
        <div className="bg-muted rounded-card grid justify-items-start gap-3 p-5">
          <p className="text-lg">
            This link waited more than {HOLD_MINUTES} minutes, so the seats went
            back.
          </p>
          <Link href={`/events/${slug}`} className={OUTLINE_PILL}>
            Sign up again
          </Link>
        </div>
      ) : (
        <SignupAnswer
          id={signup.id}
          token={token}
          slug={slug}
          confirmed={signup.confirmed}
          holdMinutes={HOLD_MINUTES}
        />
      )}
    </div>
  );
}
