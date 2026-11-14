import type { Instrumentation } from "next";

/**
 * Every server error as one JSON line, so it is easy to find in the
 * Vercel logs, and ready for a log drain should one be added (audit
 * ops:1). The query is left out: Order links carry their access token.
 */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context
) => {
  const err = error instanceof Error ? error : null;
  console.error(
    JSON.stringify({
      level: "error",
      message: err?.message ?? String(error),
      stack: err?.stack,
      digest:
        typeof error === "object" && error !== null && "digest" in error
          ? String(error.digest)
          : undefined,
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      type: context.routeType,
    })
  );
};
