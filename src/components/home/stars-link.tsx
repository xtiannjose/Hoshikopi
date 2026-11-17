import Link from "next/link";

import { currentMember } from "@/modules/identity";

const LINK =
  "border-input inline-flex min-h-12 w-fit items-center rounded-full border px-6 font-semibold no-underline";

/** For a Guest: the way to a Star Card. */
export function GetStarsLink() {
  return (
    <Link href="/sign-in?next=/account" className={LINK}>
      Get your Star Card
    </Link>
  );
}

/**
 * Home's Stars link: a signed-in Member goes to their own Stars instead of
 * the sign-in form again (audit UI2-25). In Suspense, so Home stays
 * prerendered for Guests.
 */
export async function StarsLink() {
  const member = await currentMember();
  if (!member) return <GetStarsLink />;
  return (
    <Link href="/account/stars" className={LINK}>
      See your Stars
    </Link>
  );
}
