import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart } from "@/modules/cart";
import { placeOrder, transition } from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const annika = { kind: "staff", id: "seed-barista", role: "barista" } as const;

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

/** Emails written to data/mail/ for an address (no RESEND_API_KEY in tests). */
async function mailTo(address: string): Promise<string[]> {
  const dir = path.join(process.cwd(), "data", "mail");
  const files = (await readdir(dir).catch(() => [])).filter((f) =>
    f.endsWith(`-${address}.txt`)
  );
  return Promise.all(files.map((f) => readFile(path.join(dir, f), "utf8")));
}

describe("Order emails (ORD-10)", () => {
  it("sends Order placed for Pay at Pickup and Ready for pickup", async () => {
    const address = `christian-${Date.now()}@example.com`;
    const owner = { guestTokenHash: address };
    const item = await db.menuItem.findUniqueOrThrow({
      where: { slug: "ube-pandesal" },
    });
    await addLine(owner, {
      menuItemId: item.id,
      optionIds: [],
      quantity: 1,
      note: "",
    });
    const result = await placeOrder({
      owner,
      memberId: null,
      seenTotalCents: (await getCart(owner)).totalCents,
      customerName: "Christian",
      customerEmail: address,
      customerPhone: "",
      pickup: { kind: "asap" },
      paymentMethod: "pay_at_pickup",
    });
    if (!result.ok) throw new Error(result.reason);
    const [placed] = await mailTo(address);
    expect(placed).toContain(`Order ${result.code} at Hoshikopi`);
    expect(placed).toContain(
      `/orders/${result.orderId}?t=${result.accessToken}`
    );

    for (const to of ["accepted", "preparing", "ready"] as const) {
      await transition(result.orderId, to, annika);
    }
    const all = await mailTo(address);
    expect(
      all.some((m) => m.includes(`${result.code} is ready for pickup`))
    ).toBe(true);
  });
});
