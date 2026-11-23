"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { now } from "@/lib/clock";

const CLOSED = ["picked_up", "cancelled", "expired", "refunded"];

/** How long past its Pickup Time, and its last change, a page keeps asking. */
const KEEP_ASKING = 3 * 60 * 60_000;

// Browsers allow sound only after a tap; the Notify button's tap unlocks it.
let audio: AudioContext | null = null;

// Notification permission as a store, so the button updates after a tap.
const listeners = new Set<() => void>();
const readPermission = () =>
  "Notification" in window ? Notification.permission : "unsupported";
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function chime() {
  try {
    audio ??= new AudioContext();
    const start = audio.currentTime;
    for (const [i, frequency] of [880, 1320].entries()) {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const at = start + i * 0.18;
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0.15, at);
      volume.gain.exponentialRampToValueAtTime(0.001, at + 0.4);
      tone.connect(volume).connect(audio.destination);
      tone.start(at);
      tone.stop(at + 0.4);
    }
  } catch {
    // No sound without a tap first; the title and notification still go.
  }
}

async function notify(code: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  try {
    // Through the service worker: Android shows notifications no other way.
    await navigator.serviceWorker.register("/sw.js");
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Your order is ready", {
      body: `Show code ${code} at the counter.`,
    });
  } catch {
    // Blocked or unsupported: the page itself still says Ready.
  }
}

function announceReady(code: string) {
  document.title = `Ready: ${code} · Hoshikopi`;
  chime();
  navigator.vibrate?.([200, 100, 200]);
  void notify(code);
}

/**
 * Asks every 5 seconds until Ready (every 15 while the tab is hidden, so a
 * background tab can still alert), then every 30 while the tab shows, and
 * re-renders the page when it changed (ADR 0009). On the change to Ready it
 * chimes, vibrates, retitles the tab and notifies if allowed. One forgotten
 * tab kept Neon Free awake (audit ops:14), so it stops 3 hours past the
 * Pickup Time and the last change; the tab coming back still checks once.
 */
export function StatusPoller({
  id,
  token,
  code,
  status,
  version,
  windowStart,
}: {
  id: string;
  token: string;
  code: string;
  status: string;
  version: string;
  /** The Pickup Time, in milliseconds. */
  windowStart: number;
}) {
  const router = useRouter();
  const seen = useRef(status);
  // The version the page stopped asking at; a newer one starts it again.
  const [stoppedAt, setStoppedAt] = useState<string | null>(null);
  const permission = useSyncExternalStore(
    subscribe,
    readPermission,
    () => "unsupported"
  );

  useEffect(() => {
    if (seen.current !== "ready" && status === "ready") announceReady(code);
    seen.current = status;
  }, [status, code]);

  useEffect(() => {
    if (CLOSED.includes(status)) return;
    let last = 0;
    const check = async () => {
      // Ready has already alerted, so a hidden tab need not ask.
      if (status === "ready" && document.hidden) return;
      const gap =
        status === "ready" ? 30_000 : document.hidden ? 15_000 : 5_000;
      if (Date.now() - last < gap - 500) return;
      last = Date.now();
      const response = await fetch(
        `/api/orders/${id}/status?t=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      ).catch(() => null);
      if (!response?.ok) return;
      const latest = (await response.json()) as { version: string };
      if (latest.version !== version) router.refresh();
    };
    const stopAt = Math.max(now().getTime(), windowStart) + KEEP_ASKING;
    const timer = setInterval(() => {
      if (now().getTime() < stopAt) return void check();
      clearInterval(timer);
      setStoppedAt(version);
    }, 5_000);
    const onShow = () => {
      last = 0;
      void check();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [id, token, status, version, windowStart, router]);

  if (CLOSED.includes(status)) return null;
  if (stoppedAt === version) {
    return (
      <p className="text-muted-foreground mt-2">
        No news for 3 hours, so this page stopped checking. Reload it to see
        where your order is.
      </p>
    );
  }
  if (status === "ready") return null;
  if (permission === "granted") {
    return (
      <p className="text-muted-foreground mt-2">
        We&apos;ll let you know here when it&apos;s ready.
      </p>
    );
  }
  if (permission !== "default") return null;
  return (
    <button
      type="button"
      onClick={async () => {
        audio ??= new AudioContext();
        await Notification.requestPermission();
        listeners.forEach((listener) => listener());
      }}
      className="border-input mt-3 min-h-11 rounded-full border px-5 font-semibold"
    >
      Notify me when it&apos;s ready
    </button>
  );
}
