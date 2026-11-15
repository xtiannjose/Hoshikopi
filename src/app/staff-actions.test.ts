import { afterEach, expect, it, vi } from "vitest";

import { requireStaff } from "@/modules/identity";

import * as bar from "./bar/actions";
import * as cafe from "./manage/cafe/actions";
import * as content from "./manage/content-actions";
import * as hours from "./manage/hours/actions";
import * as inquiries from "./manage/inquiries/actions";
import * as menu from "./manage/menu/actions";
import * as orders from "./manage/orders/actions";
import * as staff from "./manage/staff/actions";
import * as stars from "./manage/stars/actions";
// Sign out (manage/actions.ts) and the Second Factor form serve anyone
// signed in, so they have no role to check. A new Staff action file needs
// an import here.

const GUARD = vi.hoisted(() => new Error("stopped at requireStaff"));
vi.mock("@/modules/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/identity")>()),
  requireStaff: vi.fn(async () => {
    throw GUARD;
  }),
}));

// The role each action needs and where it returns to: /manage asks for the
// Second Factor, the Bar Screen's Barista-level taps do not (ADR 0014).
const NEEDS: Record<string, ["barista" | "manager", string]> = {
  advanceOrder: ["barista", "/bar"],
  toggleSoldOut: ["barista", "/bar"],
  cancelAtBar: ["manager", "/bar"],
  saveCafeAction: ["manager", "/manage"],
  saveEventAction: ["manager", "/manage"],
  savePostAction: ["manager", "/manage"],
  deletePostAction: ["manager", "/manage"],
  saveRecurringAction: ["manager", "/manage"],
  saveWeeklyHoursAction: ["manager", "/manage"],
  saveSpecialHoursAction: ["manager", "/manage"],
  deleteSpecialHoursAction: ["manager", "/manage"],
  saveCapacityAction: ["manager", "/manage"],
  pauseAction: ["manager", "/manage"],
  resumeAction: ["manager", "/manage"],
  busyAction: ["manager", "/manage"],
  endBusyAction: ["manager", "/manage"],
  inquiryStatusAction: ["manager", "/manage"],
  saveMenuItemAction: ["manager", "/manage"],
  saveCategoryAction: ["manager", "/manage"],
  saveOptionGroupAction: ["manager", "/manage"],
  saveOptionAction: ["manager", "/manage"],
  deleteOptionGroupAction: ["manager", "/manage"],
  refundAction: ["manager", "/manage"],
  cancelAction: ["manager", "/manage"],
  setRoleAction: ["manager", "/manage"],
  endSessionsAction: ["manager", "/manage"],
  adjustStarsAction: ["manager", "/manage"],
};

type Action = (...args: unknown[]) => Promise<unknown>;
const actions = [
  bar,
  cafe,
  content,
  hours,
  inquiries,
  menu,
  orders,
  staff,
  stars,
]
  .flatMap((module) => Object.entries(module))
  .filter(([, value]) => typeof value === "function") as [string, Action][];

afterEach(() => vi.clearAllMocks());

// A dropped guard in one action would pass every other test (audit
// tests:13).
it("lists every Staff action once", () => {
  expect(actions.map(([name]) => name).sort()).toEqual(
    Object.keys(NEEDS).sort()
  );
});

// Each takes (form), (state, form) or (id, value); a FormData in each
// place is harmless, since the guard stops it first.
it.each(actions)("%s checks its Staff role first", async (name, action) => {
  const form = new FormData();
  await expect(action(form, form)).rejects.toBe(GUARD);
  const [[role, next]] = vi.mocked(requireStaff).mock.calls;
  const [want, prefix] = NEEDS[name];
  expect(role).toBe(want);
  expect(next ?? "/manage").toMatch(new RegExp(`^${prefix}(/|$)`));
});
