import { siteUrl } from "@/lib/env";
import { getCafeContact } from "@/modules/cafe";
import { eventCalendar, getEvent } from "@/modules/content";

/** An Event as a calendar file (EVT-04). */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/events/[slug]/calendar">
) {
  const { slug } = await params;
  const [event, cafe] = await Promise.all([getEvent(slug), getCafeContact()]);
  if (!event) return new Response("Not found", { status: 404 });
  const site = siteUrl();
  return new Response(eventCalendar(event, site, cafe.area), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
