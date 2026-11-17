import { randomUUID } from "node:crypto";

import { z } from "zod";

import { plainText } from "@/lib/text";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { dayValue, now } from "@/lib/clock";
import { db } from "@/lib/db";
import { orderingState, pickupWindows, type Counts } from "@/modules/cafe";
import {
  clearCart,
  getCart,
  lockCart,
  type CartOwner,
  type CartView,
} from "@/modules/cart";
import {
  canRedeem,
  reserveRedemption,
  STARS_PER_REWARD,
} from "@/modules/loyalty";
import { startPayment, type OnlineMethod } from "@/modules/payments";

import { orderingDay } from "./day";
import {
  fitsOneOrder,
  GUEST_PAY_AT_PICKUP_MAX_DRINKS,
  orderLimit,
} from "./rules";
import { emailOrderPlaced } from "./emails";
import { putLinesBack } from "./again";
import { hashToken, orderLink, orderToken } from "./links";
import type { OrderLineOption } from "./snapshot";
import { nextOrderCode, transition } from "./status";
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
  /** Spend 9 Stars on a free drink (LOY-03). */
  useReward?: boolean;
  /** cartFingerprint of the Cart the Customer saw, if the form sent it. */
  seenCart?: string;
};

export type PlaceOrderResult =
  | {
      ok: true;
      orderId: string;
      code: string;
      windowStart: Date;
      /** For the status link; only its hash is stored. */
      accessToken: string;
      /** The provider's hosted checkout for online Payment Methods. */
      checkoutUrl: string | null;
      totalCents: number;
    }
  | { ok: false; reason: "invalid"; errors: Partial<Record<string, string>> }
  | { ok: false; reason: "closed" | "paused" | "cart_problem" }
  | { ok: false; reason: "price_changed" | "cart_changed"; totalCents: number }
  | { ok: false; reason: "pay_at_pickup_limit" }
  | { ok: false; reason: "too_big"; limit: { drinks: number; food: number } }
  | { ok: false; reason: "not_enough_stars" | "reward_unavailable" }
  | { ok: false; reason: "payment_start_failed" }
  | { ok: false; reason: "window_unavailable" | "no_window" }
  | { ok: false; reason: "window_full"; nextWindow: Date | null };

type Line = CartView["lines"][number];

/**
 * Which Lines, in what quantities, a Cart holds. Checkout sends it with the
 * total it showed, so a change from another tab is caught even when the
 * total stays the same (audit journeys:17).
 */
export const cartFingerprint = (cart: CartView) =>
  cart.lines
    .map((line) => `${line.id}:${line.quantity}`)
    .sort()
    .join(",");

/** A Line's Base Price: its unit price less its Options' Price Deltas. */
export const baseOf = (line: Line) =>
  line.unitCents! - line.options.reduce((sum, o) => sum + o.deltaCents, 0);

/** The drink a Reward makes free: the one with the highest Base Price. */
export function rewardLineOf(cart: CartView): Line | undefined {
  return [...cart.lines]
    .filter((line) => line.isDrink && line.problem === null)
    .sort((a, b) => baseOf(b) - baseOf(a))[0];
}

/**
 * Snapshot Lines for the Order (names, Options, prices). The Reward's Line
 * gives up one unit to a separate Reward Line priced at its Option deltas.
 */
function snapshotLines(lines: Line[], rewardLine: Line | undefined) {
  return lines.flatMap((line) => {
    const snapshot = {
      menuItemId: line.menuItemId,
      name: line.name,
      // The shape snapshotOptions reads back (audit architecture:20).
      options: line.options.map(({ group, name, deltaCents }) => ({
        group,
        name,
        deltaCents,
      })) satisfies OrderLineOption[],
      optionIds: line.options.map((option) => option.id),
      isDrink: line.isDrink,
      note: line.note || null,
    };
    const unit = line.unitCents!;
    const paid = line === rewardLine ? line.quantity - 1 : line.quantity;
    return [
      ...(paid > 0
        ? [
            {
              ...snapshot,
              unitCents: unit,
              quantity: paid,
              lineCents: unit * paid,
            },
          ]
        : []),
      ...(line === rewardLine
        ? [
            {
              ...snapshot,
              unitCents: unit - baseOf(line),
              quantity: 1,
              lineCents: unit - baseOf(line),
              isReward: true,
            },
          ]
        : []),
    ];
  });
}

/** "0917 123 4567" or "+63 917..." -> "+639171234567"; null if not a PH mobile. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");
  const match = /^(?:\+63|0)(9\d{9})$/.exec(digits);
  return match ? `+63${match[1]}` : null;
}

const Contact = z
  .object({
    customerName: plainText
      .trim()
      .min(1, "Enter your name.")
      .max(60, "Use 60 characters or fewer, like your first name."),
    customerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .refine((v) => v === "" || z.email().safeParse(v).success, {
        message: "Enter an email address, like hoshi@example.com.",
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
  const result = await db.$transaction(
    async (
      tx
    ): Promise<
      | Exclude<PlaceOrderResult, { ok: true }>
      | (Extract<PlaceOrderResult, { ok: true }> & {
          paymentMethod: PaymentMethod;
        })
    > => {
      const at = now();
      const day = await orderingDay(at, tx);
      const state = orderingState(at, day);
      if (!state.canOrder) {
        return {
          ok: false,
          reason: state.reason === "paused" ? "paused" : "closed",
        };
      }

      // A second Place order on the same Cart (double tap, retry, two tabs)
      // waits here and then finds the Cart already emptied.
      await lockCart(input.owner, tx);
      const cart = await getCart(input.owner, tx);
      if (cart.lines.length === 0 || cart.blocked) {
        return { ok: false, reason: "cart_problem" };
      }
      // A Reward makes one unit of the dearest drink free; its Options
      // still charge their Price Delta (LOY-03, docs/03 section 5).
      const rewardLine = input.useReward ? rewardLineOf(cart) : undefined;
      if (input.useReward && (!input.memberId || !rewardLine)) {
        return { ok: false, reason: "reward_unavailable" };
      }
      const totalCents =
        cart.totalCents - (rewardLine ? baseOf(rewardLine) : 0);
      if (
        input.seenCart !== undefined &&
        input.seenCart !== cartFingerprint(cart)
      ) {
        return { ok: false, reason: "cart_changed", totalCents };
      }
      if (totalCents !== input.seenTotalCents) {
        return { ok: false, reason: "price_changed", totalCents };
      }
      // A Reward that covers everything leaves nothing to pay online, so
      // the Order goes to the bar like Pay at Pickup (audit journeys:11).
      const paymentMethod =
        totalCents === 0 ? "pay_at_pickup" : input.paymentMethod;
      const limit = orderLimit(day.capacity);
      if (!fitsOneOrder(cart, limit)) {
        return { ok: false, reason: "too_big", limit };
      }
      if (
        paymentMethod === "pay_at_pickup" &&
        input.memberId === null &&
        cart.drinks > GUEST_PAY_AT_PICKUP_MAX_DRINKS
      ) {
        return { ok: false, reason: "pay_at_pickup_limit" };
      }

      // Lock the Member and check the Stars before taking any room.
      if (rewardLine && !(await canRedeem(tx, input.memberId!))) {
        return { ok: false, reason: "not_enough_stars" };
      }

      // Choose the Pickup Window from what is offered right now.
      const need: Counts = { drinks: cart.drinks, food: cart.foodLines };
      const { prepMinutes: prep, windows: offered } = await offeredWindows(
        tx,
        at,
        day,
        need
      );
      if (input.pickup.kind === "scheduled") {
        const chosen = input.pickup.windowStart.getTime();
        const valid = pickupWindows(at, day, {
          prepMinutes: prep,
          need: { drinks: 0, food: 0 },
          used: new Map(),
        }).some((w) => w.start.getTime() === chosen);
        if (!valid) return { ok: false, reason: "window_unavailable" };
      }

      // Lock a window's row and check Capacity under the lock (ADR 0007).
      // ASAP walks the offered windows in order, so one that filled after
      // it was offered passes to the next with room (audit ORD-06).
      const roomUnderLock = async (start: Date) => {
        await tx.$executeRaw`
        INSERT INTO pickup_window_usage (window_start, service_day, drinks, food, updated_at)
        VALUES (${start}, ${dayValue(day.day)}::date, 0, 0, now())
        ON CONFLICT (window_start) DO NOTHING`;
        const [locked] = await tx.$queryRaw<{ drinks: number; food: number }[]>`
        SELECT drinks, food FROM pickup_window_usage
        WHERE window_start = ${start} FOR UPDATE`;
        return (
          locked.drinks + need.drinks <= day.capacity.drinks &&
          locked.food + need.food <= day.capacity.food
        );
      };
      let windowStart: Date | undefined;
      if (input.pickup.kind === "asap") {
        for (const { start } of offered) {
          if (await roomUnderLock(start)) {
            windowStart = start;
            break;
          }
        }
        if (!windowStart) return { ok: false, reason: "no_window" };
      } else {
        const chosen = input.pickup.windowStart;
        if (!(await roomUnderLock(chosen))) {
          const next = offered.find(
            (w) => w.start.getTime() > chosen.getTime()
          );
          return {
            ok: false,
            reason: "window_full",
            nextWindow: next?.start ?? null,
          };
        }
        windowStart = chosen;
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
      const id = randomUUID();
      const accessToken = orderToken(id);
      const order = await tx.order.create({
        data: {
          id,
          serviceDay: dayValue(day.day),
          code,
          status: "placed",
          memberId: input.memberId,
          customerName: contact.data.customerName,
          customerEmail: contact.data.customerEmail || null,
          customerPhone: normalizePhone(contact.data.customerPhone),
          pickupKind: input.pickup.kind,
          windowStart,
          paymentMethod,
          totalCents,
          rewardStars: rewardLine ? STARS_PER_REWARD : 0,
          accessTokenHash: hashToken(accessToken),
          placedAt: at,
          lines: { create: snapshotLines(cart.lines, rewardLine) },
          events: {
            create: {
              at,
              toStatus: "placed",
              actorKind: "customer",
              actorId: input.memberId,
            },
          },
        },
      });
      if (rewardLine) await reserveRedemption(tx, input.memberId!, order.id);
      await clearCart(input.owner, tx);
      return {
        ok: true,
        orderId: order.id,
        code,
        windowStart,
        accessToken,
        checkoutUrl: null,
        totalCents: order.totalCents,
        paymentMethod,
      };
    }
  );
  if (!result.ok) return result;
  const { paymentMethod, ...placed } = result;
  // Pay at Pickup goes to the bar now; online Orders email once paid.
  if (paymentMethod === "pay_at_pickup") {
    await emailOrderPlaced(placed.orderId);
    return placed;
  }
  try {
    const { checkoutUrl } = await startPayment({
      orderId: placed.orderId,
      orderCode: placed.code,
      amountCents: placed.totalCents,
      method: paymentMethod as OnlineMethod,
      returnUrl: orderLink(placed.orderId),
    });
    return { ...placed, checkoutUrl };
  } catch (error) {
    // Nothing was charged: let the Order go now, so its window and Stars
    // come back, and put its Lines back so "Try again" has a Cart (audit
    // ORD-05, PAY-03). A move refused meanwhile (a Manager cancelled it)
    // keeps the Lines on that Order.
    console.error("[payments] checkout not started:", error);
    const moved = await transition(placed.orderId, "expired", {
      kind: "system",
    });
    if (moved.ok) {
      const lines = await db.orderLine.findMany({
        where: { orderId: placed.orderId },
        orderBy: { createdAt: "asc" },
      });
      await putLinesBack(lines, input.owner);
    }
    return { ok: false, reason: "payment_start_failed" };
  }
}
