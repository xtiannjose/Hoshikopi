import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart } from "@/modules/cart";
import {
  adjustStars,
  balance,
  earnForOrder,
  starHistory,
} from "@/modules/loyalty";
import { placeOrder, refundOrder, transition } from "@/modules/ordering";

import { createTestDb, resetToSeed } from "./helpers";

const db = createTestDb();
const annika = { kind: "staff", id: "seed-barista", role: "barista" } as const;
const christian = {
  kind: "staff",
  id: "seed-manager",
  role: "manager",
} as const;
const HOSHI = "seed-member";

beforeEach(async () => {
  await resetToSeed(db);
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

/** 2 Kopi Hitam and 1 Ube Pandesal, for a Member or a Guest. */
async function order(memberId: string | null) {
  const owner = memberId
    ? { memberId }
    : { guestTokenHash: `g-${Math.random()}` };
  const items = Object.fromEntries(
    (
      await db.menuItem.findMany({
        include: {
          optionGroups: {
            include: { optionGroup: { include: { options: true } } },
          },
        },
      })
    ).map((i) => [i.slug, i])
  );
  const defaults = (slug: string) =>
    items[slug].optionGroups.flatMap(({ optionGroup }) =>
      optionGroup.minSelect > 0
        ? [optionGroup.options.find((o) => o.isDefault)!.id]
        : []
    );
  await addLine(owner, {
    menuItemId: items["kopi-hitam"].id,
    optionIds: defaults("kopi-hitam"),
    quantity: 2,
    note: "",
  });
  await addLine(owner, {
    menuItemId: items["ube-pandesal"].id,
    optionIds: [],
    quantity: 1,
    note: "",
  });
  const result = await placeOrder({
    owner,
    memberId,
    seenTotalCents: (await getCart(owner)).totalCents,
    customerName: "Hoshi",
    customerEmail: "hoshi@example.com",
    customerPhone: "",
    pickup: { kind: "asap" },
    paymentMethod: "pay_at_pickup",
  });
  if (!result.ok) throw new Error(result.reason);
  return result.orderId;
}

async function pickUp(orderId: string) {
  for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
    await transition(orderId, to, annika);
  }
}

describe("earning Stars (LOY-01)", () => {
  it("earns 1 Star per drink when a Member's Order is Picked Up", async () => {
    const id = await order(HOSHI);
    await transition(id, "accepted", annika);
    expect(await balance(HOSHI)).toBe(0);
    await transition(id, "preparing", annika);
    await transition(id, "ready", annika);
    await transition(id, "picked_up", annika);
    expect(await balance(HOSHI)).toBe(2);
    expect(await starHistory(HOSHI)).toEqual([
      expect.objectContaining({ kind: "earn", stars: 2, orderId: id }),
    ]);
  });

  it("earns nothing for a Guest", async () => {
    await pickUp(await order(null));
    expect(await db.starEntry.count()).toBe(0);
  });

  it("takes the Stars back when a picked-up Order is Refunded", async () => {
    const id = await order(HOSHI);
    await pickUp(id);
    await refundOrder(id, christian);
    expect(await balance(HOSHI)).toBe(0);
    expect((await starHistory(HOSHI)).map((e) => [e.kind, e.stars])).toEqual([
      ["reverse", -2],
      ["earn", 2],
    ]);
  });

  it("keeps spent Stars spent: a Refund never takes the balance below zero", async () => {
    // Without the floor, a Refund after spending left a negative balance (audit tests:2).
    const id = await order(HOSHI);
    await pickUp(id);
    expect(await balance(HOSHI)).toBe(2);
    expect(await adjustStars(HOSHI, -2, "Used on a treat", christian)).toEqual({
      ok: true,
    });
    expect(await refundOrder(id, christian)).toEqual({ ok: true });
    expect(await balance(HOSHI)).toBe(0);
    expect(
      await db.starEntry.count({ where: { orderId: id, kind: "reverse" } })
    ).toBe(0);
  });
});

// The database took a second earn for one Order, and entries and Order
// events took the database's clock, not lib/clock (DATA-04, architecture:16).
describe("once-only entries on the cafe's clock", () => {
  it("earns once even if asked twice, and every row takes lib/clock's time", async () => {
    const id = await order(HOSHI);
    await pickUp(id);
    // A repeat is a no-op, not an error that would undo its transaction.
    await db.$transaction((tx) =>
      earnForOrder(tx, { id, memberId: HOSHI, drinks: 2 })
    );
    expect(
      await db.starEntry.count({ where: { orderId: id, kind: "earn" } })
    ).toBe(1);
    const frozen = new Date("2026-11-02T01:00:00Z");
    const entries = await db.starEntry.findMany({ where: { orderId: id } });
    const events = await db.orderEvent.findMany({ where: { orderId: id } });
    expect(entries.map((e) => e.createdAt)).toEqual(entries.map(() => frozen));
    expect(events.map((e) => e.at)).toEqual(events.map(() => frozen));
    expect(events.length).toBe(5);
  });
});

describe("Manager adjustments (LOY-05)", () => {
  // The form said "Up to 50 at a time" but any amount saved, and a
  // Manager could give Stars to themselves (audit staff:11).
  it("refuses more than 50 Stars at a time, and a Manager's own account", async () => {
    expect(await adjustStars(HOSHI, 51, "Big gift", christian)).toEqual({
      ok: false,
      reason: "too_many",
    });
    expect(await adjustStars(HOSHI, -51, "Big mistake", christian)).toEqual({
      ok: false,
      reason: "too_many",
    });
    expect(await adjustStars("seed-manager", 5, "For me", christian)).toEqual({
      ok: false,
      reason: "self",
    });
    expect(await balance(HOSHI)).toBe(0);
    expect(await adjustStars(HOSHI, 50, "Welcome gift", christian)).toEqual({
      ok: true,
    });
  });

  it("adds or removes Stars with a reason, never below zero", async () => {
    expect(await adjustStars(HOSHI, 3, "Welcome gift", christian)).toEqual({
      ok: true,
    });
    expect(await balance(HOSHI)).toBe(3);
    expect(await adjustStars(HOSHI, -4, "Mistake", christian)).toEqual({
      ok: false,
      reason: "below_zero",
    });
    expect(await adjustStars(HOSHI, 1, " ", christian)).toEqual({
      ok: false,
      reason: "reason_required",
    });
    expect(await adjustStars(HOSHI, -3, "Mistake", christian)).toEqual({
      ok: true,
    });
    expect(await balance(HOSHI)).toBe(0);
    expect(
      await db.auditLog.count({ where: { action: "loyalty.adjust" } })
    ).toBe(2);
  });

  it("is for Managers only", async () => {
    expect(await adjustStars(HOSHI, 3, "Hi", annika)).toEqual({
      ok: false,
      reason: "not_allowed",
    });
  });
});
