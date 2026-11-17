import { beforeEach, describe, expect, it, vi } from "vitest";

import { addLine } from "@/modules/cart";

import { addFavouriteAction } from "./actions";

vi.mock("@/modules/identity", () => ({
  requireMember: async () => ({ id: "seed-member" }),
}));
vi.mock("@/modules/cart", () => ({
  favouritesFor: async () => [
    { id: "fav-1", menuItemId: "latte", optionIds: ["oat"] },
  ],
  addLine: vi.fn(),
}));
vi.mock("next/cache", () => ({ refresh: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));

const add = (id = "fav-1") => {
  const form = new FormData();
  form.set("id", id);
  return addFavouriteAction(form);
};

beforeEach(() => {
  vi.mocked(addLine).mockReset();
});

// A Favourite that could not be added always said "1 item from that order
// is sold out or off the menu", even for a Line already at 20 (audit
// DC-34).
describe("addFavouriteAction", () => {
  it("goes to the Cart when the Favourite is added", async () => {
    vi.mocked(addLine).mockResolvedValue({ ok: true });
    await expect(add()).rejects.toThrow("redirect /cart");
  });

  it("says the Line is full when it already holds 20", async () => {
    vi.mocked(addLine).mockResolvedValue({ ok: false, reason: "too_many" });
    await expect(add()).rejects.toThrow("redirect /cart?favourite=full");
  });

  it("says it can't be added today when sold out, off the menu or gone", async () => {
    vi.mocked(addLine).mockResolvedValue({ ok: false, reason: "sold_out" });
    await expect(add()).rejects.toThrow("redirect /cart?favourite=unavailable");
    await expect(add("not-mine")).rejects.toThrow(
      "redirect /cart?favourite=unavailable"
    );
  });
});
