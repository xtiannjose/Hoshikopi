import { orderVersion } from "@/modules/ordering";

/** A few bytes for the status page's polling (ADR 0009). */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/orders/[id]/status">
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const version = await orderVersion(id, token);
  if (!version) return new Response("Not found", { status: 404 });
  return Response.json(version, {
    headers: { "Cache-Control": "no-store" },
  });
}
