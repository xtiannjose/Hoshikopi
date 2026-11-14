import { describe, expect, it } from "vitest";

import {
  orderPlacedEmail,
  orderReadyEmail,
  type OrderForEmail,
} from "./templates";

const ORDER: OrderForEmail = {
  code: "K-042",
  customerName: "Hoshi",
  customerEmail: "hoshi@example.com",
  pickupKind: "asap",
  windowStart: new Date("2026-11-02T08:15:00Z"),
  paymentMethod: "pay_at_pickup",
  totalCents: 33500,
  lines: [
    {
      name: "Hoshi Latte",
      options: ["Large", "Oat milk", "50%", "Normal"],
      quantity: 1,
      lineCents: 25000,
    },
    { name: "Ube Pandesal", options: [], quantity: 1, lineCents: 7500 },
    { name: "Sago", options: [], quantity: 1, lineCents: 1000 },
  ],
};

describe("orderPlacedEmail (ORD-10)", () => {
  const email = orderPlacedEmail(ORDER, "https://hoshikopi.test/orders/x?t=y");

  // One time everywhere, the window the Order is booked in (audit
  // journeys:10).
  it("names the Order Code and Pickup Time in the subject", () => {
    expect(email.to).toBe("hoshi@example.com");
    expect(email.subject).toBe("Order K-042 at Hoshikopi: ready by 4:15 PM");
    expect(email.text).toContain("Pickup: ready by 4:15 PM today");
    expect(
      orderPlacedEmail({ ...ORDER, pickupKind: "scheduled" }, "x").subject
    ).toBe("Order K-042 at Hoshikopi: pickup at 4:15 PM");
  });

  // The free drink reads as one (audit journeys:13).
  it("names a Reward Line as free with 9 Stars", () => {
    const free = orderPlacedEmail(
      {
        ...ORDER,
        lines: [
          {
            name: "Hoshi Latte",
            options: ["Large", "Oat milk"],
            quantity: 1,
            lineCents: 6500,
            isReward: true,
          },
        ],
      },
      "x"
    );
    expect(free.text).toContain(
      "1 x Hoshi Latte, free with 9 Stars (Large, Oat milk): PHP 65.00"
    );
  });

  it("lists the Lines, the total with its VAT part, and the status link", () => {
    expect(email.text).toContain("Salamat, Hoshi! We got your order.");
    expect(email.text).toContain(
      "1 x Hoshi Latte (Large, Oat milk, 50%, Normal): PHP 250.00"
    );
    // 33500 x 12/112 = 3589.29 centavos, rounded half up.
    expect(email.text).toContain("Total: PHP 335.00 (VAT included: PHP 35.89)");
    expect(email.text).toContain("Pay at the counter when you collect.");
    expect(email.text).toContain("https://hoshikopi.test/orders/x?t=y");
    expect(email.text).toContain("Hoshikopi is a concept cafe.");
    // No en or em dashes in Customer copy.
    expect(email.text).not.toMatch(new RegExp("[\\u2013\\u2014]"));
  });
});

describe("orderReadyEmail (ORD-10)", () => {
  it("says it is ready and which code to show", () => {
    const email = orderReadyEmail({ ...ORDER, lines: [ORDER.lines[0]] });
    expect(email.subject).toBe("K-042 is ready for pickup");
    expect(email.text).toContain(
      "Your Hoshi Latte is ready at the counter. Show code K-042."
    );
  });

  // Not "your Hoshi Latte" for a three-item Order (audit journeys:13).
  it("says your order when there is more than one thing", () => {
    expect(orderReadyEmail(ORDER).text).toContain(
      "Your order is ready at the counter. Show code K-042."
    );
    expect(
      orderReadyEmail({
        ...ORDER,
        lines: [{ ...ORDER.lines[0], quantity: 2 }],
      }).text
    ).toContain("Your order is ready at the counter.");
  });
});
