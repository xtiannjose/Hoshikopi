import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, deleteMemberCart, getCart } from "@/modules/cart";
import { forgetMember, memberProfile, updateProfile } from "@/modules/identity";
import { forgetStars, starHistory } from "@/modules/loyalty";
import {
  deidentifyOrders,
  ordersForExport,
  placeOrder,
} from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const BEA = "seed-member";

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

async function beaOrders() {
  const item = await db.menuItem.findUniqueOrThrow({
    where: { slug: "ube-pandesal" },
  });
  const owner = { memberId: BEA };
  await addLine(owner, {
    menuItemId: item.id,
    optionIds: [],
    quantity: 1,
    note: "",
  });
  const result = await placeOrder({
    owner,
    memberId: BEA,
    seenTotalCents: (await getCart(owner)).totalCents,
    customerName: "Bea Santos",
    customerEmail: "bea@hoshikopi.example",
    customerPhone: "0917 123 4567",
    pickup: { kind: "asap" },
    paymentMethod: "pay_at_pickup",
  });
  if (!result.ok) throw new Error(result.reason);
  await db.starEntry.create({
    data: { memberId: BEA, kind: "adjust", stars: 2, reason: "test" },
  });
  // Something left in the Cart.
  await addLine(owner, {
    menuItemId: item.id,
    optionIds: [],
    quantity: 2,
    note: "",
  });
  return result;
}

describe("Your details (ACC-03)", () => {
  it("saves a name and a separate marketing opt-in", async () => {
    await updateProfile(BEA, { name: "Bea S.", marketingOptIn: true });
    expect(await memberProfile(BEA)).toMatchObject({
      name: "Bea S.",
      email: "bea@hoshikopi.example",
      marketingOptIn: true,
    });
  });
});

describe("data export (ACC-03)", () => {
  it("includes the profile, Orders and Star history", async () => {
    const placed = await beaOrders();
    const orders = await ordersForExport(BEA);
    expect(orders).toEqual([
      expect.objectContaining({
        code: placed.code,
        totalCents: 7500,
        lines: [
          { name: "Ube Pandesal", quantity: 1, lineCents: 7500, options: [] },
        ],
      }),
    ]);
    expect(await starHistory(BEA)).toHaveLength(1);
  });
});

describe("deleting an account (ACC-03)", () => {
  it("keeps Orders for the cafe's records without the Member, and forgets the rest", async () => {
    const placed = await beaOrders();
    await deidentifyOrders(BEA);
    await forgetStars(BEA);
    await deleteMemberCart(BEA);
    await forgetMember(BEA);

    const order = await db.order.findUniqueOrThrow({
      where: { id: placed.orderId },
    });
    expect(order).toMatchObject({
      memberId: null,
      customerName: "Deleted customer",
      customerEmail: "deleted@hoshikopi.invalid",
      customerPhone: null,
      totalCents: 7500,
    });
    expect(await db.starEntry.count({ where: { memberId: BEA } })).toBe(0);
    expect(await db.cart.count({ where: { memberId: BEA } })).toBe(0);
    const user = await db.user.findUniqueOrThrow({ where: { id: BEA } });
    expect(user.deletedAt).not.toBeNull();
    expect(user.email).not.toContain("bea");
    expect(user.name).toBe("");
    expect(await db.session.count({ where: { userId: BEA } })).toBe(0);
    expect(await memberProfile(BEA)).toBeNull();
  });
});
