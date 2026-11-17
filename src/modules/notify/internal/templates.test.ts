import { describe, expect, it } from "vitest";

import {
  eventSignupEmail,
  inquiryEmail,
  orderPlacedEmail,
  orderReadyEmail,
  signInEmail,
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
  rewardStars: 0,
  area: "Kapitolyo, Pasig",
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
        rewardStars: 9,
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

  // A Reward that covers the whole Order is stored as Pay at Pickup, and
  // the email asked for payment at the counter (audit DC-30).
  it("asks for nothing when a Reward covers the whole Order", () => {
    const free = orderPlacedEmail(
      { ...ORDER, totalCents: 0, rewardStars: 9 },
      "x"
    );
    expect(free.text).toContain("Nothing to pay: a free drink.");
    expect(free.text).not.toContain("Pay at the counter");
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

  // The cafe's area comes from Cafe Settings (audit architecture:17).
  it("names the cafe's area in the footer", () => {
    expect(
      orderPlacedEmail({ ...ORDER, area: "Maginhawa, Quezon City" }, "x").text
    ).toContain("Hoshikopi, Maginhawa, Quezon City.");
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

// These three lived inline in notify/index.ts with no test (audit
// architecture:22).
describe("signInEmail", () => {
  it("carries the link and how long it works", () => {
    const email = signInEmail("hoshi@example.com", "https://x.test/link");
    expect(email).toMatchObject({
      to: "hoshi@example.com",
      subject: "Your Hoshikopi sign-in link",
    });
    expect(email.text).toContain("It works once, for 5 minutes.");
    expect(email.text).toContain("https://x.test/link");
  });
});

describe("inquiryEmail", () => {
  it("tells the Manager what was asked, and says when a field was left out", () => {
    const email = inquiryEmail("cafe@example.com", {
      kind: "large_order",
      name: "Lia",
      email: "lia@example.com",
      wantedOn: null,
      guests: 30,
      message: "Thirty iced lattes for an office party.",
    });
    expect(email.subject).toBe("New inquiry: a large order from Lia");
    expect(email.text).toContain("Reply to: lia@example.com");
    expect(email.text).toContain("Date: not given");
    expect(email.text).toContain("Guests: 30");
    expect(email.text).toContain("Thirty iced lattes for an office party.");
  });
});

describe("eventSignupEmail", () => {
  const signup = {
    to: "hoshi@example.com",
    seats: 2,
    event: {
      title: "Latte art night",
      startsAt: new Date("2026-11-20T11:00:00Z"),
      priceCents: 35000,
    },
    link: "https://x.test/signup",
    confirmed: false,
    holdMinutes: 30,
  };

  it("asks a Guest to confirm within the hold, with the price at the door", () => {
    const email = eventSignupEmail(signup);
    expect(email.subject).toMatch(/^Confirm your seats: Latte art night, /);
    expect(email.text).toContain(
      "Open this link within 30 minutes to keep your 2 seats"
    );
    expect(email.text).toContain("Pay PHP 350 a seat at the door.");
    expect(email.text).not.toMatch(new RegExp("[\u2013\u2014]"));
  });

  it("only offers to cancel once confirmed, and says a free Event is free", () => {
    const email = eventSignupEmail({
      ...signup,
      confirmed: true,
      seats: 1,
      event: { ...signup.event, priceCents: null },
    });
    expect(email.subject).toMatch(/^You're in: Latte art night, /);
    expect(email.text).toContain("You have 1 seat for Latte art night");
    expect(email.text).toContain("It's free. Just come by.");
  });
});
