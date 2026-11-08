import Link from "next/link";
import { UserCircleIcon, UserIcon } from "@phosphor-icons/react/ssr";

import { currentMember } from "@/modules/identity";

import { MenuLink } from "./menu-link";

// A round icon button like the menu button. Under sm the phone menu holds
// Account instead, so the header keeps room for the Cart.
const iconClass =
  "border-input hover:bg-muted hidden size-11 place-items-center rounded-full border no-underline sm:grid";

export function SignInLink() {
  return (
    <Link
      href="/sign-in"
      aria-label="Sign in"
      title="Sign in"
      className={iconClass}
    >
      <UserIcon aria-hidden size={20} />
    </Link>
  );
}

/** Account once signed in (a filled icon), else Sign in (inside Suspense). */
export async function AccountLink() {
  const member = await currentMember();
  if (!member) return <SignInLink />;
  return (
    <Link
      href="/account"
      aria-label="Account"
      title="Account"
      className={`${iconClass} bg-muted`}
    >
      <UserCircleIcon aria-hidden size={24} weight="fill" />
    </Link>
  );
}

/** The phone menu's entry: Account once signed in, else Sign in. */
export async function AccountMenuLink() {
  const member = await currentMember();
  return member ? (
    <MenuLink href="/account" icon={<UserCircleIcon size={20} />}>
      Account
    </MenuLink>
  ) : (
    <SignInMenuLink />
  );
}

/** The phone menu's Sign in, also its entry before the session is read. */
export function SignInMenuLink() {
  return (
    <MenuLink href="/sign-in" icon={<UserIcon size={20} />}>
      Sign in
    </MenuLink>
  );
}
