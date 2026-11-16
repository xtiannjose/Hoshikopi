import { afterEach, describe, expect, it, vi } from "vitest";

import { botCheck } from "./bot-check";

afterEach(() => vi.unstubAllEnvs());

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
};
const at = new Date("2026-11-16T03:00:00Z");
const ago = (ms: number) => String(at.getTime() - ms);

// The Inquiry form had only a rate limit, so scripted text flooded the
// Manager's list (audit SEC1-06).
describe("botCheck", () => {
  it("passes a person: an empty trap field and a few seconds of typing", () => {
    expect(botCheck(form({ website: "", started: ago(8_000) }), at)).toBe(null);
  });

  it("catches the trap field a script fills in", () => {
    expect(
      botCheck(
        form({ website: "https://spam.example", started: ago(8_000) }),
        at
      )
    ).toBe("honeypot");
  });

  it("catches a form sent within 2 seconds of opening", () => {
    expect(botCheck(form({ website: "", started: ago(500) }), at)).toBe(
      "too_fast"
    );
  });

  it("lets a form through without a start time (no JavaScript)", () => {
    expect(botCheck(form({ website: "" }), at)).toBe(null);
  });

  it("takes the minimum from FORM_MIN_FILL_MS (0 for the end-to-end run)", () => {
    vi.stubEnv("FORM_MIN_FILL_MS", "0");
    expect(botCheck(form({ website: "", started: ago(0) }), at)).toBe(null);
  });
});
