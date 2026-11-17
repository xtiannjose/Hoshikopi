import { describe, expect, it, vi } from "vitest";

import { requireStaff } from "@/modules/identity";

import {
  busyAction,
  endBusyAction,
  pauseAction,
  resumeAction,
} from "./actions";

// Stop at the role check: only where it sends the Manager back matters here.
vi.mock("@/modules/identity", () => ({
  requireStaff: vi.fn(async () => {
    throw new Error("stopped at the role check");
  }),
}));

const ACTIONS = { pauseAction, resumeAction, busyAction, endBusyAction };

/** Where the action's role check would send the Manager back to. */
async function returnsTo(
  action: (form: FormData) => Promise<unknown>,
  from?: string
) {
  const form = new FormData();
  if (from !== undefined) form.set("from", from);
  form.set("minutes", "10");
  form.set("forMinutes", "30");
  vi.mocked(requireStaff).mockClear();
  try {
    await action(form);
  } catch {
    // The mocked role check stops every action.
  }
  return vi.mocked(requireStaff).mock.calls[0]?.[1];
}

// On a Bar Screen open past the Second Factor's 12 hours, Pause and Busy
// Mode sent the Manager to the code page and then to Hours and Capacity,
// leaving the Bar Screen (audit DC-12).
describe("Pause and Busy Mode actions", () => {
  it("come back to the Bar Screen when tapped there", async () => {
    for (const [name, action] of Object.entries(ACTIONS)) {
      expect(await returnsTo(action, "/bar"), name).toBe("/bar");
    }
  });

  it("take no other address from the form", async () => {
    for (const [name, action] of Object.entries(ACTIONS)) {
      for (const from of [
        undefined,
        "https://example.com",
        "//bar",
        "/manage",
      ]) {
        expect(await returnsTo(action, from), `${name} ${from}`).toBe(
          "/manage/hours"
        );
      }
    }
  });
});
