import { clientIp, takeToken } from "@/lib/rate-limit";
import { receivePaymentWebhook } from "@/modules/ordering";

/**
 * Payment provider webhooks (PAY-03): the raw body is verified against the
 * signature before anything is read from it.
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/webhooks/[provider]">
) {
  const { provider } = await params;
  // The provider retries a 429, so a burst only slows its own deliveries.
  if (!(await takeToken(`webhook-ip:${clientIp(request.headers)}`, 120, 60))) {
    return Response.json({ result: "slow_down" }, { status: 429 });
  }
  const rawBody = await request.text();
  const response = await receivePaymentWebhook(
    provider,
    rawBody,
    request.headers
  );
  return Response.json(
    { result: response.result },
    { status: response.status }
  );
}
