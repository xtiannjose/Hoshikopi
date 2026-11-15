import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakePayAction } from "./actions";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));
vi.mock("@/modules/ordering", () => ({
  orderLink: (id: string) => `http://localhost:3000/orders/${id}?t=tok`,
}));
vi.mock("@/modules/payments", () => ({
  paymentByCheckout: vi.fn(async () => ({ orderId: "order_1" })),
  signFakeEvent: vi.fn(() => ({ body: "{}", headers: new Headers() })),
}));

const form = (outcome: "pay" | "fail") => {
  const data = new FormData();
  data.set("checkoutId", "fake_cs_1");
  data.set("outcome", outcome);
  return data;
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// A refused webhook left the Order unpaid with no word (audit SEC1-17).
describe("fakePayAction", () => {
  it.each([401, 404, 429, 500])(
    "sends the Customer back to try again when the webhook answers %i",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(null, { status }))
      );
      await expect(fakePayAction(form("pay"))).rejects.toThrow(
        "NEXT_REDIRECT /dev/pay/fake_cs_1?retry=1"
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[payments]"),
        status
      );
    }
  );

  it("does the same when the webhook cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      })
    );
    await expect(fakePayAction(form("fail"))).rejects.toThrow(
      "NEXT_REDIRECT /dev/pay/fake_cs_1?retry=1"
    );
    expect(console.error).toHaveBeenCalled();
  });

  it("goes on to the Order page when the webhook takes it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 }))
    );
    await expect(fakePayAction(form("pay"))).rejects.toThrow(
      "NEXT_REDIRECT http://localhost:3000/orders/order_1?t=tok"
    );
  });
});
