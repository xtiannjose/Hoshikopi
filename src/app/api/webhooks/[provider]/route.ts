import { limits } from "@/lib/limits";
import { clientIp } from "@/lib/rate-limit";
import { receivePaymentWebhook } from "@/modules/ordering";

/** A provider's event is a few kB; Vercel itself allows 4.5 MB (audit SEC1-10). */
const MAX_BODY = 64 * 1024;
const tooLarge = () => Response.json({ result: "too_large" }, { status: 413 });

/**
 * Payment provider webhooks (PAY-03): the raw body is verified against the
 * signature before anything is read from it.
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/webhooks/[provider]">
) {
  const { provider } = await params;
  if (!(await limits.webhook(clientIp(request.headers)))) {
    return Response.json({ result: "slow_down" }, { status: 429 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return tooLarge();
  }
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY) return tooLarge();
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
