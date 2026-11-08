import { fakeProvider, type FakeProvider } from "./fake";
import { payMongoProvider } from "./paymongo";
import type { PaymentProvider, ProviderEvent } from "./types";

const LOCAL = ["localhost", "127.0.0.1"];

/** Where the fake provider may run: locally, *.vercel.app and previews. */
function demoHost(env: NodeJS.ProcessEnv): boolean {
  if (env.VERCEL_ENV === "preview") return true;
  if (!env.NEXT_PUBLIC_SITE_URL) return false;
  const host = new URL(env.NEXT_PUBLIC_SITE_URL).hostname;
  return LOCAL.includes(host) || host.endsWith(".vercel.app");
}

/**
 * The provider for this environment (ADR 0003, ADR 0006). PayMongo runs only
 * with a test key, on every environment; the fake provider never runs on a
 * production domain (it may run locally and on *.vercel.app demos).
 */
export function providerFor(env: NodeJS.ProcessEnv): PaymentProvider {
  if (env.PAYMENT_PROVIDER === "paymongo") {
    const key = env.PAYMONGO_SECRET_KEY ?? "";
    if (!key.startsWith("sk_test_")) {
      throw new Error(
        "PayMongo needs a test key (sk_test_...); live keys are refused (ADR 0003)."
      );
    }
    if (!env.PAYMONGO_WEBHOOK_SECRET) {
      throw new Error("PAYMONGO_WEBHOOK_SECRET is not set.");
    }
    return payMongoProvider(key, env.PAYMONGO_WEBHOOK_SECRET);
  }
  if (env.NODE_ENV === "production") {
    // Fail closed: no address could hide a real domain, and no secret would
    // sign webhooks with a key anyone can read in this repository.
    if (!env.NEXT_PUBLIC_SITE_URL || !env.BETTER_AUTH_SECRET) {
      throw new Error(
        "The fake payment provider needs NEXT_PUBLIC_SITE_URL and BETTER_AUTH_SECRET in production."
      );
    }
    if (!demoHost(env)) {
      throw new Error(
        "The fake payment provider refuses to run on a production domain (ADR 0003)."
      );
    }
  }
  return fakeProvider(`fake-webhook:${env.BETTER_AUTH_SECRET ?? "local"}`);
}

let current: PaymentProvider | null = null;

/** The provider for this server, checked once. */
export function paymentProvider(): PaymentProvider {
  current ??= providerFor(process.env);
  return current;
}

/**
 * Demo Mode (ADR 0015) is on wherever the fake provider may run: locally,
 * on *.vercel.app and on previews. A visitor may then play the barista on
 * their own Order.
 */
export function demoMode(env: NodeJS.ProcessEnv = process.env): boolean {
  // The provider's own rule, without building it: a prerendered page asks
  // this at build time, when a preview build may have no secret.
  if (env.PAYMENT_PROVIDER === "paymongo") return false;
  return env.NODE_ENV !== "production" || demoHost(env);
}

/** Signs an event as the fake checkout page sends it; fake provider only. */
export function signFakeEvent(event: ProviderEvent) {
  const provider = paymentProvider();
  if (provider.name !== "fake") throw new Error("Not the fake provider");
  return (provider as FakeProvider).signedEvent(event);
}
