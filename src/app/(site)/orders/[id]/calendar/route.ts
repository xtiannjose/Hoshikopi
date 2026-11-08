import { calendarFile } from "@/lib/calendar";
import { getCafeContact, WINDOW_MINUTES } from "@/modules/cafe";
import { getOrderForCustomer, orderLink } from "@/modules/ordering";

/** A Scheduled Pickup as a calendar file (FEAT-10); the link token opens it. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/orders/[id]/calendar">
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const order = await getOrderForCustomer(id, token);
  if (!order || order.pickupKind !== "scheduled") {
    return new Response("Not found", { status: 404 });
  }
  const { area } = await getCafeContact();
  const lines = order.lines.map((l) => `${l.quantity} x ${l.name}`).join(", ");
  const ics = calendarFile({
    uid: `${order.id}@hoshikopi`,
    startsAt: order.windowStart,
    endsAt: new Date(order.windowStart.getTime() + WINDOW_MINUTES * 60_000),
    summary: `Pick up your Hoshikopi order ${order.code}`,
    description: `${lines}. Show code ${order.code} at the bar. (Hoshikopi is a concept cafe.)`,
    location: `Hoshikopi, ${area}`,
    url: orderLink(order.id),
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="hoshikopi-${order.code}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
