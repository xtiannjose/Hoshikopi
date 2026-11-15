import { describe, expect, it } from "vitest";

import { roomHint } from "./room-hint";

// A Pickup Time close to full says so in words (audit FEAT-03).
describe("roomHint", () => {
  it("names the drinks left when one or two are", () => {
    expect(roomHint(1)).toBe("1 drink left");
    expect(roomHint(2)).toBe("2 drinks left");
  });

  it("says filling up with three or four left, and nothing with more", () => {
    expect(roomHint(3)).toBe("Filling up");
    expect(roomHint(4)).toBe("Filling up");
    expect(roomHint(5)).toBeNull();
  });
});
