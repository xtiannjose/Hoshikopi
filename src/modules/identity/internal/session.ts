import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import type { Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

import { auth } from "./auth";

async function currentUser() {
  // Read headers first: touching auth.api reads the clock, which must not
  // happen while Next prerenders the shell.
  const requestHeaders = await headers();
  await connection();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, name: true, email: true, role: true },
  });
}

export type Staff = { id: string; name: string; role: Role };

/**
 * The signed-in Staff member with at least `role` (a Manager may do what a
 * Barista does). Signed out goes to sign-in; anyone else gets a 404.
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
  return { id: user.id, name: user.name, role: user.role };
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
}
