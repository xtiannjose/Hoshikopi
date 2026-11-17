import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { freezeClock, now, unfreezeClock } from "@/lib/clock";
import { nextOrderCode, transition, type Actor } from "@/modules/ordering";

import { createTestDb, resetToSeed } from "./helpers";

const db = createTestDb();
const WINDOW = new Date("2026-11-02T02:00:00Z");

const customer: Actor = { kind: "customer" };
const webhook: Actor = { kind: "webhook" };
const system: Actor = { kind: "system" };
const annika: Actor = { kind: "staff", id: "seed-barista", role: "barista" };
const christian: Actor = { kind: "staff", id: "seed-manager", role: "manager" };
const demo: Actor = { kind: "demo" };

beforeEach(async () => {
  await resetToSeed(db);
});
afterEach(() => {
  unfreezeClock();
  vi.unstubAllEnvs();
});
afterAll(() => db.$disconnect());

/** An Order of 2 drinks and 1 food Line holding room in WINDOW. */
async function placedOrder(
  paymentMethod: PaymentMethod = "pay_at_pickup",
  data: { status?: OrderStatus; paidAt?: Date | null } = {}
) {
  await db.pickupWindowUsage.upsert({
    where: { windowStart: WINDOW },
    update: { drinks: { increment: 2 }, food: { increment: 1 } },
    create: {
      windowStart: WINDOW,
      serviceDay: new Date("2026-11-02"),
      drinks: 2,
      food: 1,
    },
  });
  return db.order.create({
    data: {
      serviceDay: new Date("2026-11-02"),
      code: `K-${Math.random().toString().slice(2, 8)}`,
      status: "placed",
      ...data,
      customerName: "Hoshi",
      customerEmail: "hoshi@hoshikopi.example",
      pickupKind: "scheduled",
      windowStart: WINDOW,
      paymentMethod,
      totalCents: 44500,
      accessTokenHash: "x",
      // The cafe clock, like placeOrder (audit architecture:16).
      placedAt: now(),
      lines: {
        create: [
          {
            name: "Hoshi Latte",
            options: [],
            unitCents: 18500,
            quantity: 2,
            lineCents: 37000,
            isDrink: true,
          },
          {
            name: "Ube Pandesal",
            options: [],
            unitCents: 7500,
            quantity: 1,
            lineCents: 7500,
            isDrink: false,
          },
        ],
      },
      events: {
        create: { at: now(), toStatus: "placed", actorKind: "customer" },
      },
    },
  });
}

const usage = async () =>
  db.pickupWindowUsage.findUniqueOrThrow({ where: { windowStart: WINDOW } });

const statusOf = async (id: string) =>
  (await db.order.findUniqueOrThrow({ where: { id } })).status;

describe("transition: Pay at Pickup through the bar", () => {
  it("moves Placed > Accepted > Preparing > Ready > Picked Up", async () => {
    const order = await placedOrder();
    for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
      expect(await transition(order.id, to, annika)).toMatchObject({
        ok: true,
      });
    }
    const done = await db.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { events: { orderBy: { at: "asc" } } },
    });
    expect(done.status).toBe("picked_up");
    expect(done.paidAtCounter).toBe(true);
    expect(done.acceptedAt && done.readyAt && done.pickedUpAt).toBeTruthy();
    expect(
      done.events.map((e) => `${e.fromStatus}>${e.toStatus}:${e.actorKind}`)
    ).toEqual([
      "null>placed:customer",
      "placed>accepted:staff",
      "accepted>preparing:staff",
      "preparing>ready:staff",
      "ready>picked_up:staff",
    ]);
  });

  // From every step, not only the first: a mutation letting Preparing go
  // straight to Picked Up passed the suite (Phase 9 check, audit tests:3).
  it("refuses skipping a step, from every step", async () => {
    const order = await placedOrder();
    const path = [
      "placed",
      "accepted",
      "preparing",
      "ready",
      "picked_up",
    ] as const;
    for (let i = 0; i < path.length - 1; i++) {
      for (const skip of path.slice(i + 2)) {
        expect(
          await transition(order.id, skip, annika),
          `${path[i]} > ${skip}`
        ).toEqual({ ok: false, reason: "not_allowed", status: path[i] });
      }
      await transition(order.id, path[i + 1], annika);
    }
  });
});

describe("transition: online payment", () => {
  it("needs a verified payment before the bar accepts", async () => {
    const order = await placedOrder("gcash");
    expect((await transition(order.id, "accepted", annika)).ok).toBe(false);
    expect((await transition(order.id, "paid", annika)).ok).toBe(false);
    expect((await transition(order.id, "paid", webhook)).ok).toBe(true);
    expect((await transition(order.id, "accepted", annika)).ok).toBe(true);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } })).paidAt
    ).toBeTruthy();
  });

  it("expires an unpaid online Order and gives back its window", async () => {
    const order = await placedOrder("maya");
    expect(await usage()).toMatchObject({ drinks: 2, food: 1 });
    expect((await transition(order.id, "expired", system)).ok).toBe(true);
    expect(await usage()).toMatchObject({ drinks: 0, food: 0 });
  });

  it("never expires a Pay at Pickup Order", async () => {
    const order = await placedOrder();
    expect((await transition(order.id, "expired", system)).ok).toBe(false);
  });
});

describe("transition: cancelling (ORD-09)", () => {
  // The daily cron closes a Pay at Pickup Order nobody took by the end of
  // its day, and nothing else (audit ORD-13).
  it("lets the system cancel only an earlier day's Placed Pay at Pickup Order", async () => {
    freezeClock("2026-11-02T20:00:00+08:00");
    const today = await placedOrder();
    expect(await transition(today.id, "cancelled", system, "x")).toEqual({
      ok: false,
      reason: "not_allowed",
      status: "placed",
    });

    freezeClock("2026-11-03T06:00:00+08:00");
    const online = await placedOrder("gcash");
    expect((await transition(online.id, "cancelled", system, "x")).ok).toBe(
      false
    );
    const accepted = await placedOrder();
    await transition(accepted.id, "accepted", annika);
    expect((await transition(accepted.id, "cancelled", system, "x")).ok).toBe(
      false
    );
    expect((await transition(today.id, "cancelled", system, "x")).ok).toBe(
      true
    );
    const after = await db.order.findUniqueOrThrow({
      where: { id: today.id },
      include: { events: { orderBy: { at: "desc" }, take: 1 } },
    });
    expect(after.cancelReason).toBe("x");
    expect(after.events[0]).toMatchObject({
      fromStatus: "placed",
      toStatus: "cancelled",
      actorKind: "system",
    });
  });

  it("lets the Customer cancel before Accepted and gives back the window", async () => {
    const order = await placedOrder();
    expect((await transition(order.id, "cancelled", customer)).ok).toBe(true);
    expect(await usage()).toMatchObject({ drinks: 0, food: 0 });
  });

  it("refuses a Customer cancel once the bar accepted", async () => {
    const order = await placedOrder();
    await transition(order.id, "accepted", annika);
    expect(await transition(order.id, "cancelled", customer)).toEqual({
      ok: false,
      reason: "not_allowed",
      status: "accepted",
    });
  });

  it("lets a Manager cancel up to Ready, with a reason", async () => {
    const order = await placedOrder();
    await transition(order.id, "accepted", annika);
    await transition(order.id, "preparing", annika);
    expect(await transition(order.id, "cancelled", christian)).toEqual({
      ok: false,
      reason: "reason_required",
      status: "preparing",
    });
    expect(
      (await transition(order.id, "cancelled", annika, "Out of milk")).ok
    ).toBe(false);
    expect(
      (await transition(order.id, "cancelled", christian, "Out of milk")).ok
    ).toBe(true);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } }))
        .cancelReason
    ).toBe("Out of milk");
  });

  it("gives the window back once when two cancels race", async () => {
    const order = await placedOrder();
    const results = await Promise.all([
      transition(order.id, "cancelled", customer),
      transition(order.id, "cancelled", customer),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await usage()).toMatchObject({ drinks: 0, food: 0 });
  });
});

describe("transition: Refunds", () => {
  it("refunds a cancelled paid Order once, without giving the window back twice", async () => {
    const order = await placedOrder("card");
    await transition(order.id, "paid", webhook);
    await transition(order.id, "cancelled", customer);
    expect((await transition(order.id, "refunded", annika)).ok).toBe(false);
    expect((await transition(order.id, "refunded", christian)).ok).toBe(true);
    expect(await usage()).toMatchObject({ drinks: 0, food: 0 });
    expect(await statusOf(order.id)).toBe("refunded");
  });

  it("refuses refunding a cancelled Order that was never paid", async () => {
    const order = await placedOrder();
    await transition(order.id, "cancelled", customer);
    expect((await transition(order.id, "refunded", christian)).ok).toBe(false);
  });

  it("refunds a Picked Up Order", async () => {
    const order = await placedOrder();
    for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
      await transition(order.id, to, annika);
    }
    expect((await transition(order.id, "refunded", christian)).ok).toBe(true);
  });
});

// Every Order Status against every target and actor, so widening any rule
// in allowed() fails here, and Demo Mode off refuses the visitor (audit tests:3).
describe("transition: the docs/03 section 7 table (audit tests:3)", () => {
  const paidAt = new Date("2026-11-02T01:30:00Z");
  type State = {
    name: string;
    method: PaymentMethod;
    status: OrderStatus;
    paidAt?: Date;
  };
  const STATES: State[] = [
    { name: "placed-pap", method: "pay_at_pickup", status: "placed" },
    { name: "placed-online", method: "gcash", status: "placed" },
    { name: "paid", method: "gcash", status: "paid", paidAt },
    { name: "accepted", method: "pay_at_pickup", status: "accepted" },
    { name: "preparing", method: "pay_at_pickup", status: "preparing" },
    { name: "ready", method: "pay_at_pickup", status: "ready" },
    { name: "picked_up", method: "pay_at_pickup", status: "picked_up" },
    { name: "cancelled-paid", method: "card", status: "cancelled", paidAt },
    { name: "cancelled-unpaid", method: "pay_at_pickup", status: "cancelled" },
    { name: "expired", method: "gcash", status: "expired" },
    { name: "refunded", method: "card", status: "refunded", paidAt },
  ];
  const TARGETS: OrderStatus[] = [
    "placed",
    "paid",
    "accepted",
    "preparing",
    "ready",
    "picked_up",
    "cancelled",
    "expired",
    "refunded",
  ];
  const ACTORS = {
    customer,
    webhook,
    system,
    barista: annika,
    manager: christian,
    demo,
  };
  type ActorName = keyof typeof ACTORS;
  const bar = (step: string) =>
    ["barista", "manager", "demo"].map((who) => `${step}:${who}`);
  // Copied from the docs/03 section 7 table, "state>to:actor".
  const ALLOWED = new Set([
    "placed-online>paid:webhook",
    "placed-online>expired:system",
    ...bar("placed-pap>accepted"),
    ...bar("paid>accepted"),
    ...bar("accepted>preparing"),
    ...bar("preparing>ready"),
    ...bar("ready>picked_up"),
    "placed-pap>cancelled:customer",
    "placed-online>cancelled:customer",
    "paid>cancelled:customer",
    "placed-pap>cancelled:system",
    "placed-pap>cancelled:manager",
    "placed-online>cancelled:manager",
    "paid>cancelled:manager",
    "accepted>cancelled:manager",
    "preparing>cancelled:manager",
    "ready>cancelled:manager",
    "cancelled-paid>refunded:manager",
    "cancelled-paid>refunded:system",
    "picked_up>refunded:manager",
  ]);

  /** Try every target with each actor from one Order Status. */
  async function check(
    state: State,
    actors: ActorName[],
    allowed: Set<string>
  ) {
    const fresh = () =>
      placedOrder(state.method, {
        status: state.status,
        paidAt: state.paidAt ?? null,
      });
    let order = await fresh();
    for (const to of TARGETS) {
      for (const who of actors) {
        const key = `${state.name}>${to}:${who}`;
        // A reason, so a Manager cancel is never refused for want of one.
        const result = await transition(order.id, to, ACTORS[who], "x");
        expect(result.ok, key).toBe(allowed.has(key));
        if (result.ok) order = await fresh();
      }
    }
  }

  it.each(STATES)("follows the table from $name", async (state) => {
    // The Order's 2026-11-02 service day has passed, for the system cancel.
    freezeClock("2026-11-03T06:00:00+08:00");
    await check(state, Object.keys(ACTORS) as ActorName[], ALLOWED);
  });

  it.each(STATES)(
    "refuses the demo actor from $name with Demo Mode off",
    async (state) => {
      // As on a PayMongo deploy.
      vi.stubEnv("PAYMENT_PROVIDER", "paymongo");
      await check(state, ["demo"], new Set());
    }
  );
});

describe("nextOrderCode", () => {
  it("counts up per service day and restarts the next day", async () => {
    expect(await nextOrderCode("2026-11-02", "K")).toBe("K-001");
    expect(await nextOrderCode("2026-11-02", "K")).toBe("K-002");
    expect(await nextOrderCode("2026-11-03", "K")).toBe("K-001");
  });
});
