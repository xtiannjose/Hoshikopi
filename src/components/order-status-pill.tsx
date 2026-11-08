import { Pill } from "./panel";

export const ORDER_STATUS_LABEL: Record<string, string> = {
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

const WAITING = ["placed", "paid", "accepted", "preparing"];

/** Ready in success, waiting Orders plain, closed ones muted. */
export function OrderStatusPill({ status }: { status: string }) {
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
