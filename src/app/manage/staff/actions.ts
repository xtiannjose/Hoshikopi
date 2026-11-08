"use server";

import { refresh } from "next/cache";

import type { Role } from "@/generated/prisma/enums";
import { endSessions, requireStaff, setRole } from "@/modules/identity";

export type RoleState = { message?: string; ok?: boolean; email?: string };

const ROLES: Role[] = ["customer", "barista", "manager"];
const BECOMES: Record<Role, string> = {
  customer: "a Member, with no staff access",
  barista: "a Barista",
  manager: "a Manager",
};
const REFUSED = {
  not_found:
    "No account has that email yet. Ask them to sign in once, with email or Google, then try again.",
  self: "You can't change your own role. Ask another Manager.",
  not_allowed: "Only Managers change roles.",
};

/** A Manager gives or takes a Staff role by email (STAFF-10). */
export async function setRoleAction(
  _prev: RoleState,
  form: FormData
): Promise<RoleState> {
  const staff = await requireStaff("manager", "/manage/staff");
  const email = String(form.get("email") ?? "");
  const role = String(form.get("role")) as Role;
  if (!ROLES.includes(role)) return { message: "Choose a role.", email };
  const result = await setRole(staff, email, role);
  if (!result.ok) return { message: REFUSED[result.reason], email };
  refresh();
  return {
    ok: true,
    message: `${result.name || email} is now ${BECOMES[role]}.`,
  };
}

/** A Manager signs a Staff member out everywhere (STAFF-10). */
export async function endSessionsAction(
  _prev: RoleState,
  form: FormData
): Promise<RoleState> {
  const staff = await requireStaff("manager", "/manage/staff");
  // The label is the name the Manager sees in the row, only echoed back.
  const label = String(form.get("label") ?? "");
  const result = await endSessions(staff, String(form.get("userId") ?? ""));
  if (!result.ok) {
    return {
      message:
        result.reason === "self"
          ? "You can't sign yourself out here. Use Sign out on Manage."
          : "Only Managers sign Staff out.",
    };
  }
  refresh();
  return {
    ok: true,
    message: `${label} is signed out on every device. They can sign in again with their email.`,
  };
}
