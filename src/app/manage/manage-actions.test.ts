import { describe, expect, it, vi } from "vitest";

import { saveEventAction } from "./content-actions";
import { saveMenuItemAction } from "./menu/actions";

const christian = { id: "seed-manager", name: "Christian", role: "manager" };

vi.mock("@/modules/identity", () => ({ requireStaff: async () => christian }));
vi.mock("next/cache", () => ({
  updateTag: () => {},
  revalidatePath: () => {},
  refresh: () => {},
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));
vi.mock("@/modules/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/content")>()),
  saveEvent: async () => ({ ok: true, id: "event-1" }),
  signupsForEvent: async () => [{ seats: 5 }, { seats: 3 }],
}));
vi.mock("@/modules/menu", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/menu")>()),
  saveMenuItemWithPhoto: async () => ({
    ok: true,
    id: "item-1",
    photoError: "We couldn't save the photo. Try again in a moment.",
  }),
}));

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
};

// Emptying Seats on an Event with Sign-ups compared 8 with NaN, so it saved
// with no warning and the guests were never told (audit DC-15).
describe("saveEventAction", () => {
  it("warns when Seats are emptied while Sign-ups hold 8", async () => {
    expect(
      await saveEventAction(
        { status: "idle" },
        form({ id: "event-1", seats: "", isPublished: "on" })
      )
    ).toEqual({
      status: "saved",
      saved:
        "Saved. Sign-ups are off now, but 8 Seats are already taken. Guests aren't told: remove Sign-ups or email them from the list.",
    });
  });

  it("still warns when Seats drop below those taken", async () => {
    const result = await saveEventAction(
      { status: "idle" },
      form({ id: "event-1", seats: "6", isPublished: "on" })
    );
    expect(result.saved).toContain("more than the 6 you set");
  });

  it("says nothing when the Seats still fit", async () => {
    expect(
      await saveEventAction(
        { status: "idle" },
        form({ id: "event-1", seats: "12", isPublished: "on" })
      )
    ).toEqual({ status: "saved" });
  });
});

// A new Menu Item whose photo failed to store landed on "Added." with no
// word about the photo (audit DC-16).
describe("saveMenuItemAction", () => {
  it("tells the new item's page the photo failed", async () => {
    await expect(
      saveMenuItemAction({ status: "idle" }, form({ name: "Tablea Mocha" }))
    ).rejects.toThrow("redirect /manage/menu/item/item-1?added=1&photo=failed");
  });
});
