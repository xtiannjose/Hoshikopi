import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { deleteAccountData } from "@/app/(site)/account/delete-account";
import { addLine, getCart } from "@/modules/cart";
import { guestRecordsFor } from "@/modules/content";
import {
  emailSignInLink,
  forgetMember,
  memberProfile,
  updateProfile,
} from "@/modules/identity";
import { starHistory } from "@/modules/loyalty";
import { ordersForExport, placeOrder } from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const HOSHI = "seed-member";

// emailSignInLink reads the request's headers, and a test has no request.
vi.mock("next/headers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/headers")>()),
  headers: async () => new Headers(),
}));

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

async function hoshiOrders() {
  const item = await db.menuItem.findUniqueOrThrow({
    where: { slug: "ube-pandesal" },
  });
  const owner = { memberId: HOSHI };
  await addLine(owner, {
    menuItemId: item.id,
    optionIds: [],
    quantity: 1,
    note: "Warm it up",
  });
  const result = await placeOrder({
    owner,
    memberId: HOSHI,
    seenTotalCents: (await getCart(owner)).totalCents,
    customerName: "Hoshi Santos",
    customerEmail: "hoshi@hoshikopi.example",
    customerPhone: "0917 123 4567",
    pickup: { kind: "asap" },
    paymentMethod: "pay_at_pickup",
  });
  if (!result.ok) throw new Error(result.reason);
  await db.starEntry.create({
    data: { memberId: HOSHI, kind: "adjust", stars: 2, reason: "test" },
  });
  // A Sign-up and an Inquiry sent with the same email.
  const event = await db.event.findFirstOrThrow();
  await db.eventSignup.create({
    data: {
      eventId: event.id,
      name: "Hoshi Santos",
      email: "hoshi@hoshikopi.example",
      seats: 2,
    },
  });
  await db.inquiry.create({
    data: {
      kind: "private_event",
      name: "Hoshi Santos",
      email: "Hoshi@hoshikopi.example",
      message: "A birthday for 12, my number is 0917 123 4567.",
    },
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
  it("saves a name, a birth month and a separate marketing opt-in", async () => {
    await updateProfile(HOSHI, {
      name: "Hoshi S.",
      marketingOptIn: true,
      birthMonth: 11,
    });
    expect(await memberProfile(HOSHI)).toMatchObject({
      name: "Hoshi S.",
      email: "hoshi@hoshikopi.example",
      marketingOptIn: true,
      birthMonth: 11,
    });
  });

  it("keeps a birth month only from 1 to 12", async () => {
    await updateProfile(HOSHI, {
      name: "Hoshi",
      marketingOptIn: false,
      birthMonth: 13,
    });
    expect(await memberProfile(HOSHI)).toMatchObject({ birthMonth: null });
  });
});

describe("data export (ACC-03)", () => {
  // It left out the contact details, Pickup Time and notes on each Order,
  // and Sign-ups and Inquiries under the Member's email (ID2-09, SEC1-19).
  it("includes the profile, Orders with contact and notes, Stars, Sign-ups and Inquiries", async () => {
    const placed = await hoshiOrders();
    const orders = await ordersForExport(HOSHI);
    expect(orders).toEqual([
      expect.objectContaining({
        code: placed.code,
        totalCents: 7500,
        customerName: "Hoshi Santos",
        customerEmail: "hoshi@hoshikopi.example",
        customerPhone: "+639171234567",
        windowStart: expect.any(Date),
        lines: [
          {
            name: "Ube Pandesal",
            quantity: 1,
            lineCents: 7500,
            options: [],
            note: "Warm it up",
          },
        ],
      }),
    ]);
    expect(await starHistory(HOSHI)).toHaveLength(1);
    const guest = await guestRecordsFor("hoshi@hoshikopi.example");
    expect(guest.signups).toEqual([
      expect.objectContaining({ name: "Hoshi Santos", seats: 2 }),
    ]);
    expect(guest.inquiries).toEqual([
      expect.objectContaining({ kind: "private_event", status: "new" }),
    ]);
  });
});

describe("deleting an account (ACC-03)", () => {
  // A link sent just before the delete would have signed in and made a
  // fresh, empty account (audit ID2-03).
  it("ends sign-in links sent before the delete, and only that person's", async () => {
    await emailSignInLink("hoshi@hoshikopi.example", "/account");
    await emailSignInLink("tala@hoshikopi.example", "/account");
    const window = new Date("2026-11-02T01:00:00Z");
    await db.rateLimit.createMany({
      data: [
        { key: "link:hoshi@hoshikopi.example", windowStart: window, count: 1 },
        {
          key: "link-pair:hoshi@hoshikopi.example:203.0.113.1",
          windowStart: window,
          count: 1,
        },
        { key: "link:tala@hoshikopi.example", windowStart: window, count: 1 },
      ],
    });
    const pending = (email: string) =>
      db.verification.count({ where: { value: { contains: email } } });
    expect(await pending("hoshi@hoshikopi.example")).toBe(1);
    await forgetMember(HOSHI);
    expect(await pending("hoshi@hoshikopi.example")).toBe(0);
    expect(await pending("tala@hoshikopi.example")).toBe(1);
    // Its sign-in limit rows go too; another person's stay.
    expect(
      await db.rateLimit.count({ where: { key: { contains: "hoshi@" } } })
    ).toBe(0);
    expect(
      await db.rateLimit.count({ where: { key: { contains: "tala@" } } })
    ).toBe(1);
  });

  // One transaction (architecture:9); Star entries stay so past totals
  // don't change (DATA-08); Sign-ups and Inquiries lose the person
  // (SEC1-19).
  it("keeps Orders for the cafe's records without the Member, and forgets the rest", async () => {
    const placed = await hoshiOrders();
    await deleteAccountData({ id: HOSHI, email: "hoshi@hoshikopi.example" });

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
    const stars = await db.starEntry.findMany({ where: { memberId: HOSHI } });
    expect(stars).toEqual([
      expect.objectContaining({ kind: "adjust", stars: 2, reason: null }),
    ]);
    expect(await db.cart.count({ where: { memberId: HOSHI } })).toBe(0);
    expect(await guestRecordsFor("hoshi@hoshikopi.example")).toEqual({
      signups: [],
      inquiries: [],
    });
    const signup = await db.eventSignup.findFirstOrThrow();
    expect(signup).toMatchObject({ name: "Deleted guest", seats: 2 });
    expect(signup.email).toMatch(/^deleted-.+@hoshikopi\.invalid$/);
    expect(await db.inquiry.findFirstOrThrow()).toMatchObject({
      name: "Deleted customer",
      email: "deleted@hoshikopi.invalid",
      message: "Removed when its sender deleted their account.",
    });
    const user = await db.user.findUniqueOrThrow({ where: { id: HOSHI } });
    expect(user.deletedAt).not.toBeNull();
    expect(user.email).not.toContain("hoshi@");
    expect(user.name).toBe("");
    expect(await db.session.count({ where: { userId: HOSHI } })).toBe(0);
    expect(await memberProfile(HOSHI)).toBeNull();
  });
});

// Postgres refuses a NUL, so a name with one gave a 500 (audit SEC2-10).
describe("Your details", () => {
  it("leaves hidden characters out of the name", async () => {
    await updateProfile(HOSHI, {
      name: "Hoshi\u0000 S.",
      marketingOptIn: false,
      birthMonth: null,
    });
    expect((await memberProfile(HOSHI))?.name).toBe("Hoshi S.");
  });
});
