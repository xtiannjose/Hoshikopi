import { eventCalendar, getEvent } from "@/modules/content";

/** An Event as a calendar file (EVT-04). */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/events/[slug]/calendar">
) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return new Response("Not found", { status: 404 });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new Response(eventCalendar(event, site), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
