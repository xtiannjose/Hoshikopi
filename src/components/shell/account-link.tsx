import Link from "next/link";

import { currentMember } from "@/modules/identity";

import { MenuLink } from "./menu-link";

const linkClass = "hidden font-medium no-underline hover:underline lg:inline";

export function SignInLink() {
  return (
    <Link href="/sign-in" className={linkClass}>
      Sign in
    </Link>
  );
}

/** "Account" once signed in, else "Sign in" (inside Suspense). */
export async function AccountLink() {
  const member = await currentMember();
  if (!member) return <SignInLink />;
  return (
    <Link href="/account" className={linkClass}>
      Account
    </Link>
  );
}

/** The phone menu's entry: Account once signed in, else Sign in. */
export async function AccountMenuLink() {
  const member = await currentMember();
  return member ? (
    <MenuLink href="/account" label="Account" />
  ) : (
    <MenuLink href="/sign-in" label="Sign in" />
  );
}
