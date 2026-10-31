import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();

beforeAll(async () => {
  await resetDb(db);
  await seedDatabase(db);
});
afterAll(() => db.$disconnect());

describe("seed", () => {
  it("loads the menu, hours, cafe details and Staff", async () => {
    expect(await db.category.count()).toBe(6);
    // Every Menu Item has alt text ready for its concept image (ADR 0012).
    expect(await db.menuItem.count({ where: { photoAlt: null } })).toBe(0);
    const latte = await db.menuItem.findUniqueOrThrow({
      where: { slug: "hoshi-latte" },
      include: { optionGroups: true },
    });
    expect(latte.baseCents).toBe(18500);
    expect(latte.badges).toContain("barista_pick");
    expect(latte.optionGroups).toHaveLength(6);
    expect(await db.openingHours.count()).toBe(7);
    expect(
      (await db.cafeSettings.findUniqueOrThrow({ where: { id: 1 } })).area
    ).toBe("Kapitolyo, Pasig");
    expect(await db.user.count({ where: { role: "manager" } })).toBe(1);
  });
});

describe("schema constraints", () => {
  it("refuses a negative Price Delta", async () => {
    const group = await db.optionGroup.findFirstOrThrow();
    await expect(
      db.option.create({
        data: { optionGroupId: group.id, name: "Discount", deltaCents: -100 },
      })
    ).rejects.toThrow(/options_delta_cents_check/);
  });

  it("refuses an Order with neither email nor phone", async () => {
    await expect(
      db.order.create({
        data: {
          serviceDay: new Date("2026-11-02"),
          code: "K-001",
          status: "placed",
          customerName: "Bea",
          pickupKind: "asap",
          windowStart: new Date(),
          paymentMethod: "pay_at_pickup",
          totalCents: 18500,
          accessTokenHash: "x",
          placedAt: new Date(),
        },
      })
    ).rejects.toThrow(/orders_contact_check/);
  });

  it("never updates an order_events row", async () => {
    const order = await db.order.create({
      data: {
        serviceDay: new Date("2026-11-02"),
        code: "K-002",
        status: "placed",
        customerName: "Bea",
        customerEmail: "bea@hoshikopi.example",
        pickupKind: "asap",
        windowStart: new Date(),
        paymentMethod: "pay_at_pickup",
        totalCents: 18500,
        accessTokenHash: "x",
        placedAt: new Date(),
        events: { create: { toStatus: "placed", actorKind: "customer" } },
      },
      include: { events: true },
    });
    await expect(
      db.orderEvent.update({
        where: { id: order.events[0].id },
        data: { reason: "edited" },
      })
    ).rejects.toThrow(/never updated or deleted/);
  });
});
