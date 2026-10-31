"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const CLOSED = ["picked_up", "cancelled", "expired", "refunded"];

/**
 * Asks every 5 seconds until Ready, then every 30 until the Order closes,
 * and re-renders the page when it changed. Pauses while the tab is hidden
 * (ADR 0009).
 */
export function StatusPoller({
  id,
  token,
  status,
  version,
}: {
  id: string;
  token: string;
  status: string;
  version: string;
}) {
  const router = useRouter();
  useEffect(() => {
    if (CLOSED.includes(status)) return;
    const check = async () => {
      if (document.hidden) return;
      const response = await fetch(
        `/api/orders/${id}/status?t=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      ).catch(() => null);
      if (!response?.ok) return;
      const latest = (await response.json()) as { version: string };
      if (latest.version !== version) router.refresh();
    };
    const timer = setInterval(check, status === "ready" ? 30_000 : 5_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [id, token, status, version, router]);
  return null;
}
