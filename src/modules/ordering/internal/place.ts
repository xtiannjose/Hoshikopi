import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { dayValue, now } from "@/lib/clock";
import { db } from "@/lib/db";
import {
  getOrderingDay,
  orderingState,
  pickupWindows,
  type Counts,
} from "@/modules/cafe";
import { clearCart, getCart, type CartOwner } from "@/modules/cart";

import { GUEST_PAY_AT_PICKUP_MAX_DRINKS, MAX_DRINKS_PER_ORDER } from "./rules";
import { nextOrderCode } from "./status";
import { offeredWindows } from "./windows";

export type Pickup =
  { kind: "asap" } | { kind: "scheduled"; windowStart: Date };

export type PlaceOrderInput = {
  owner: CartOwner;
  /** The signed-in Member, or null for a Guest. */
  memberId: string | null;
  /** The total the Customer saw; compared, never charged (ORD-06). */
  seenTotalCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickup: Pickup;
  paymentMethod: PaymentMethod;
};

export type PlaceOrderResult =
  | {
      ok: true;
      orderId: string;
      code: string;
      windowStart: Date;
      /** For the status link; only its hash is stored. */
      accessToken: string;
    }
  | { ok: false; reason: "invalid"; errors: Partial<Record<string, string>> }
  | { ok: false; reason: "closed" | "paused" | "cart_problem" }
  | { ok: false; reason: "price_changed"; totalCents: number }
  | { ok: false; reason: "too_many_drinks" | "pay_at_pickup_limit" }
  | { ok: false; reason: "payment_unavailable" }
  | { ok: false; reason: "window_unavailable" | "no_window" }
  | { ok: false; reason: "window_full"; nextWindow: Date | null };

/** "0917 123 4567" or "+63 917..." -> "+639171234567"; null if not a PH mobile. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");
  const match = /^(?:\+63|0)(9\d{9})$/.exec(digits);
  return match ? `+63${match[1]}` : null;
}

const Contact = z
  .object({
    customerName: z.string().trim().min(1, "Enter your name.").max(60),
    customerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .refine((v) => v === "" || z.email().safeParse(v).success, {
        message: "Enter an email address, like bea@example.com.",
      }),
    customerPhone: z
      .string()
      .trim()
      .refine((v) => v === "" || normalizePhone(v) !== null, {
        message: "Enter a mobile number, like 0917 123 4567.",
      }),
  })
  .refine((c) => c.customerEmail || c.customerPhone, {
    path: ["customerEmail"],
    message: "Give us an email or a mobile number for your Order.",
  });

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/**
 * Place an Order from the Cart in one transaction (docs/03 section 6): check
 * the cafe takes Orders, price the Cart again, check the caps, lock the
 * Pickup Window and take its room, then create the Order with snapshot
 * Lines and the day's next Order Code, and empty the Cart.
 */
export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  const contact = Contact.safeParse(input);
  if (!contact.success) {
    const errors: Record<string, string> = {};
    for (const issue of contact.error.issues) {
      errors[String(issue.path[0])] ??= issue.message;
    }
    return { ok: false, reason: "invalid", errors };
  }
  if (input.paymentMethod !== "pay_at_pickup") {
    // Online Payment Methods arrive with Phase 3.
    return { ok: false, reason: "payment_unavailable" };
  }

  return db.$transaction(async (tx): Promise<PlaceOrderResult> => {
    const at = now();
    const day = await getOrderingDay(at, tx);
    const state = orderingState(at, day);
    if (!state.canOrder) {
      return {
        ok: false,
        reason: state.reason === "paused" ? "paused" : "closed",
      };
    }

    const cart = await getCart(input.owner, tx);
    if (cart.lines.length === 0 || cart.blocked) {
      return { ok: false, reason: "cart_problem" };
    }
    if (cart.totalCents !== input.seenTotalCents) {
      return {
        ok: false,
        reason: "price_changed",
        totalCents: cart.totalCents,
      };
    }
    if (cart.drinks > MAX_DRINKS_PER_ORDER) {
      return { ok: false, reason: "too_many_drinks" };
    }
    if (
      input.memberId === null &&
      cart.drinks > GUEST_PAY_AT_PICKUP_MAX_DRINKS
    ) {
      return { ok: false, reason: "pay_at_pickup_limit" };
    }

    // Choose the Pickup Window from what is offered right now.
    const need: Counts = { drinks: cart.drinks, food: cart.foodLines };
    const { prepMinutes: prep, windows: offered } = await offeredWindows(
      tx,
      at,
      day,
      need
    );
    let windowStart: Date;
    if (input.pickup.kind === "asap") {
      if (!offered[0]) return { ok: false, reason: "no_window" };
      windowStart = offered[0].start;
    } else {
      windowStart = input.pickup.windowStart;
      const valid = pickupWindows(at, day, {
        prepMinutes: prep,
        need: { drinks: 0, food: 0 },
        used: new Map(),
      }).some((w) => w.start.getTime() === windowStart.getTime());
      if (!valid) return { ok: false, reason: "window_unavailable" };
    }
    const nextAfter = () =>
      offered.find((w) => w.start.getTime() > windowStart.getTime())?.start ??
      null;

    // Lock the window's row and check Capacity under the lock (ADR 0007).
    await tx.$executeRaw`
      INSERT INTO pickup_window_usage (window_start, service_day, drinks, food, updated_at)
      VALUES (${windowStart}, ${dayValue(day.day)}::date, 0, 0, now())
      ON CONFLICT (window_start) DO NOTHING`;
    const [locked] = await tx.$queryRaw<{ drinks: number; food: number }[]>`
      SELECT drinks, food FROM pickup_window_usage
      WHERE window_start = ${windowStart} FOR UPDATE`;
    if (
      locked.drinks + need.drinks > day.capacity.drinks ||
      locked.food + need.food > day.capacity.food
    ) {
      return { ok: false, reason: "window_full", nextWindow: nextAfter() };
    }
    await tx.pickupWindowUsage.update({
      where: { windowStart },
      data: {
        drinks: { increment: need.drinks },
        food: { increment: need.food },
      },
    });

    const settings = await tx.cafeSettings.findUniqueOrThrow({
      where: { id: 1 },
      select: { orderCodePrefix: true },
    });
    const code = await nextOrderCode(day.day, settings.orderCodePrefix, tx);
    const accessToken = randomBytes(32).toString("base64url");
    const order = await tx.order.create({
      data: {
        serviceDay: dayValue(day.day),
        code,
        status: "placed",
        memberId: input.memberId,
        customerName: contact.data.customerName,
        customerEmail: contact.data.customerEmail || null,
        customerPhone: normalizePhone(contact.data.customerPhone),
        pickupKind: input.pickup.kind,
        windowStart,
        paymentMethod: input.paymentMethod,
        totalCents: cart.totalCents,
        accessTokenHash: hashToken(accessToken),
        placedAt: at,
        lines: {
          create: cart.lines.map((line) => ({
            menuItemId: line.menuItemId,
            name: line.name,
            options: line.options.map(({ group, name, deltaCents }) => ({
              group,
              name,
              deltaCents,
            })),
            unitCents: line.unitCents!,
            quantity: line.quantity,
            lineCents: line.lineCents!,
            isDrink: line.isDrink,
            note: line.note || null,
          })),
        },
        events: {
          create: {
            toStatus: "placed",
            actorKind: "customer",
            actorId: input.memberId,
          },
        },
      },
    });
    await clearCart(input.owner, tx);
    return { ok: true, orderId: order.id, code, windowStart, accessToken };
  });
}

/** True when `token` opens this Order's status page. */
export function tokenMatches(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}
