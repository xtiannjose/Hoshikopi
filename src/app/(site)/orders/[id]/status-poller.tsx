"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

const CLOSED = ["picked_up", "cancelled", "expired", "refunded"];

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
      body: `Salamat! Show code ${code} at the counter.`,
    });
  } catch {
    // Blocked or unsupported: the page itself still says Ready.
  }
}

function announceReady(code: string) {
  document.title = `Ready! ${code} · Hoshikopi`;
  chime();
  navigator.vibrate?.([200, 100, 200]);
  void notify(code);
}

/**
 * Asks every 5 seconds until Ready (every 15 while the tab is hidden, so a
 * background tab can still alert), then every 30 until the Order closes,
 * and re-renders the page when it changed (ADR 0009). On the change to
 * Ready it chimes, vibrates, retitles the tab and notifies if allowed.
 */
export function StatusPoller({
  id,
  token,
  code,
  status,
  version,
}: {
  id: string;
  token: string;
  code: string;
  status: string;
  version: string;
}) {
  const router = useRouter();
  const seen = useRef(status);
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
    const timer = setInterval(check, 5_000);
    const onShow = () => {
      last = 0;
      void check();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [id, token, status, version, router]);

  if (CLOSED.includes(status) || status === "ready") return null;
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
