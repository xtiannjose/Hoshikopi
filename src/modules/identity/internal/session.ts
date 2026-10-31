import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { db } from "@/lib/db";

import { auth } from "./auth";
import { secondFactorPassed } from "./second-factor";
import { safeNext } from "./sign-in";

async function currentUser() {
  // Read headers first: touching auth.api reads the clock, which must not
  // happen while Next prerenders the shell.
  const requestHeaders = await headers();
  await connection();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, name: true, email: true, role: true },
  });
  return user && { ...user, sessionId: session.session.id };
}

export type Staff = { id: string; name: string; role: "barista" | "manager" };

/**
 * The signed-in Staff member with at least `role` (a Manager may do what a
 * Barista does). Signed out goes to sign-in; anyone else gets a 404. Under
 * /manage the session also needs the Second Factor; the Bar Screen does not
 * (ADR 0005).
 */
export async function requireStaff(
  role: "barista" | "manager",
  next = "/manage"
): Promise<Staff> {
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  const allowed =
    user.role === "manager" || (role === "barista" && user.role === "barista");
  if (!allowed) notFound();
  if (
    next.startsWith("/manage") &&
    !(await secondFactorPassed(user.sessionId))
  ) {
    redirect(`/manage/two-factor?next=${encodeURIComponent(next)}`);
  }
  // `allowed` above rules out Members.
  return { id: user.id, name: user.name, role: user.role as Staff["role"] };
}

/**
 * Staff on /manage/two-factor: signed in, Second Factor not yet entered in
 * this session. `next` is kept to /manage pages; already entered goes there.
 */
export async function staffAwaitingSecondFactor(next: string | undefined) {
  const safe = safeNext(next);
  const target = safe.startsWith("/manage") ? safe : "/manage";
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(target)}`);
  if (user.role === "customer") notFound();
  if (await secondFactorPassed(user.sessionId)) redirect(target);
  return { ...user, next: target };
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
}

export type Member = { id: string; name: string; email: string };

/** The signed-in Member, or null for a Guest (ACC-01). */
export async function currentMember(): Promise<Member | null> {
  const user = await currentUser();
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

/** The signed-in Member, or a redirect to sign-in. */
export async function requireMember(next = "/account"): Promise<Member> {
  const member = await currentMember();
  if (!member) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return member;
}

/** A Member by email, for Staff screens. */
export async function memberByEmail(email: string): Promise<Member | null> {
  return db.user.findFirst({
    where: { email: email.trim().toLowerCase(), deletedAt: null },
    select: { id: true, name: true, email: true },
  });
}
