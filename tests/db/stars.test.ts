import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart } from "@/modules/cart";
import { adjustStars, balance, starHistory } from "@/modules/loyalty";
import { placeOrder, refundOrder, transition } from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const jomar = { kind: "staff", id: "seed-barista", role: "barista" } as const;
const kai = { kind: "staff", id: "seed-manager", role: "manager" } as const;
const BEA = "seed-member";

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
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
    customerName: "Bea",
    customerEmail: "bea@example.com",
    customerPhone: "",
    pickup: { kind: "asap" },
    paymentMethod: "pay_at_pickup",
  });
  if (!result.ok) throw new Error(result.reason);
  return result.orderId;
}

async function pickUp(orderId: string) {
  for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
    await transition(orderId, to, jomar);
  }
}

describe("earning Stars (LOY-01)", () => {
  it("earns 1 Star per drink when a Member's Order is Picked Up", async () => {
    const id = await order(BEA);
    await transition(id, "accepted", jomar);
    expect(await balance(BEA)).toBe(0);
    await transition(id, "preparing", jomar);
    await transition(id, "ready", jomar);
    await transition(id, "picked_up", jomar);
    expect(await balance(BEA)).toBe(2);
    expect(await starHistory(BEA)).toEqual([
      expect.objectContaining({ kind: "earn", stars: 2, orderId: id }),
    ]);
  });

  it("earns nothing for a Guest", async () => {
    await pickUp(await order(null));
    expect(await db.starEntry.count()).toBe(0);
  });

  it("takes the Stars back when a picked-up Order is Refunded", async () => {
    const id = await order(BEA);
    await pickUp(id);
    await refundOrder(id, kai);
    expect(await balance(BEA)).toBe(0);
    expect((await starHistory(BEA)).map((e) => [e.kind, e.stars])).toEqual([
      ["reverse", -2],
      ["earn", 2],
    ]);
  });
});

describe("Manager adjustments (LOY-05)", () => {
  it("adds or removes Stars with a reason, never below zero", async () => {
    expect(await adjustStars(BEA, 3, "Welcome gift", kai)).toEqual({
      ok: true,
    });
    expect(await balance(BEA)).toBe(3);
    expect(await adjustStars(BEA, -4, "Mistake", kai)).toEqual({
      ok: false,
      reason: "below_zero",
    });
    expect(await adjustStars(BEA, 1, " ", kai)).toEqual({
      ok: false,
      reason: "reason_required",
    });
    expect(await adjustStars(BEA, -3, "Mistake", kai)).toEqual({ ok: true });
    expect(await balance(BEA)).toBe(0);
    expect(
      await db.auditLog.count({ where: { action: "loyalty.adjust" } })
    ).toBe(2);
  });

  it("is for Managers only", async () => {
    expect(await adjustStars(BEA, 3, "Hi", jomar)).toEqual({
      ok: false,
      reason: "not_allowed",
    });
  });
});
