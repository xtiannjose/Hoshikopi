import type { OrderStatus } from "@/generated/prisma/enums";

import { Pill } from "./panel";

// Keyed by the enum, so a new Order Status needs a label (audit architecture:20).
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  paid: "Paid",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked Up",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
};

const WAITING: OrderStatus[] = ["placed", "paid", "accepted", "preparing"];

/** Ready in success, waiting Orders plain, closed ones muted. */
export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <Pill
      tone={
        status === "ready"
          ? "success"
          : WAITING.includes(status)
            ? "plain"
            : "muted"
      }
    >
      {ORDER_STATUS_LABEL[status]}
    </Pill>
  );
}
