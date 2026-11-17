import { describe, expect, it } from "vitest";

import { trySteps } from "./try-steps";

// The guide always said "sign in with Google first", even where Google
// sign-in was not set up (audit journeys:20).
describe("trySteps", () => {
  it("names the sign-in this deploy offers", () => {
    expect(trySteps("google")[0].body).toContain("sign in with Google first");
    expect(trySteps("email")[0].body).toContain(
      "sign in with your email first"
    );
  });

  it("leaves sign-in and Stars out when neither is offered", () => {
    const steps = trySteps(null);
    expect(steps[0].body).not.toContain("sign in");
    expect(steps.map((step) => step.title)).toEqual([
      "Order a drink.",
      "Be the barista.",
    ]);
  });
});
