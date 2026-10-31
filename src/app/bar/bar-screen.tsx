"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { SpeakerHighIcon, SpeakerSlashIcon } from "@phosphor-icons/react";

import { formatTime } from "@/lib/clock";

import { pauseAction, resumeAction } from "../manage/hours/actions";
import { advanceOrder, cancelAtBar } from "./actions";

type Status = "placed" | "paid" | "accepted" | "preparing" | "ready";

// The board as JSON: dates arrive as ISO strings.
type Order = {
  id: string;
  code: string;
  status: Status;
  firstName: string;
  pickupKind: "asap" | "scheduled";
  windowStart: string;
  payAtPickup: boolean;
  makeNext: boolean;
  lines: {
    quantity: number;
    name: string;
    options: string[];
    note: string | null;
  }[];
};
type Board = {
  version: string;
  orders: Order[];
  paused: { until: string; message: string | null } | null;
};

const STEP: Record<Status, string> = {
  placed: "Accept",
  paid: "Accept",
  accepted: "Start making",
  preparing: "Ready",
  ready: "Picked up",
};

const MUTE_KEY = "hoshikopi-bar-muted";

/** A short two-note chime from the Web Audio API (no audio file). */
function chime() {
  try {
    const audio = new AudioContext();
    [880, 1320].forEach((frequency, i) => {
      const tone = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + i * 0.18;
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      tone.connect(gain).connect(audio.destination);
      tone.start(start);
      tone.stop(start + 0.35);
    });
  } catch {
    // No audio on this device; the highlight still shows.
  }
}

/**
 * The Bar Screen (STAFF-02): polls every 3 seconds with its version, chimes
 * and highlights new Orders, and moves an Order on with one tap.
 */
export function BarScreen({
  initial,
  manager,
  staffName,
}: {
  initial: Board;
  manager: boolean;
  staffName: string;
}) {
  const [board, setBoard] = useState(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(false);
  const [pending, startTransition] = useTransition();
  const known = useRef(new Set(initial.orders.map((o) => o.id)));
  const version = useRef(initial.version);
  const mutedRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MUTE_KEY) === "1";
      mutedRef.current = saved;
      const apply = setTimeout(() => setMuted(saved), 0);
      return () => clearTimeout(apply);
    } catch {
      return undefined;
    }
  }, []);

  const poll = useCallback(async () => {
    const response = await fetch(
      `/api/bar?v=${encodeURIComponent(version.current)}`,
      {
        cache: "no-store",
      }
    ).catch(() => null);
    if (!response?.ok) return;
    const data = (await response.json()) as Board | { same: true };
    if ("same" in data) return;
    const arrived = data.orders.filter((o) => !known.current.has(o.id));
    data.orders.forEach((o) => known.current.add(o.id));
    version.current = data.version;
    setBoard(data);
    if (arrived.length > 0) {
      if (!mutedRef.current) chime();
      setFresh(new Set(arrived.map((o) => o.id)));
      setTimeout(() => setFresh(new Set()), 4_000);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) void poll();
    }, 3_000);
    return () => clearInterval(timer);
  }, [poll]);

  const act = (run: () => Promise<unknown>) =>
    startTransition(async () => {
      await run();
      await poll();
    });

  const toggleSound = () => {
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {}
    if (!next) chime();
  };

  const columns: { title: string; orders: Order[]; later?: Order[] }[] = [
    {
      title: "New",
      orders: board.orders.filter(
        (o) => (o.status === "placed" || o.status === "paid") && o.makeNext
      ),
      later: board.orders.filter(
        (o) => (o.status === "placed" || o.status === "paid") && !o.makeNext
      ),
    },
    {
      title: "Making",
      orders: board.orders.filter(
        (o) => o.status === "accepted" || o.status === "preparing"
      ),
    },
    {
      title: "Ready",
      orders: board.orders.filter((o) => o.status === "ready"),
    },
  ];

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl italic">Bar Screen</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm">{staffName}</span>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={!muted}
            className="border-input inline-flex min-h-12 items-center gap-2 rounded-full border px-4 font-semibold"
          >
            {muted ? (
              <SpeakerSlashIcon aria-hidden size={22} />
            ) : (
              <SpeakerHighIcon aria-hidden size={22} />
            )}
            Sound for new orders
          </button>
          {manager &&
            (board.paused ? (
              <form
                action={resumeAction}
                onSubmit={() => setTimeout(poll, 500)}
              >
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground min-h-12 rounded-full px-5 font-semibold"
                >
                  Resume ordering
                </button>
              </form>
            ) : (
              <form action={pauseAction} onSubmit={() => setTimeout(poll, 500)}>
                <input type="hidden" name="minutes" value="30" />
                <input
                  type="hidden"
                  name="message"
                  value="The bar is swamped. Back in 30 minutes, salamat!"
                />
                <button
                  type="submit"
                  className="border-warning text-warning min-h-12 rounded-full border px-5 font-semibold"
                >
                  Pause ordering 30 min
                </button>
              </form>
            ))}
        </div>
      </header>

      {board.paused && (
        <p role="status" className="text-warning text-lg font-semibold">
          Ordering Paused until {formatTime(new Date(board.paused.until))}.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3" aria-busy={pending}>
        {columns.map((column) => (
          <section
            key={column.title}
            aria-labelledby={`col-${column.title}`}
            className="bg-muted rounded-card grid content-start gap-3 p-3"
          >
            <h2 id={`col-${column.title}`} className="text-xl font-semibold">
              {column.title}{" "}
              <span className="text-muted-foreground font-mono">
                {column.orders.length}
              </span>
            </h2>
            {column.orders.length === 0 && (
              <p className="text-muted-foreground">Nothing here.</p>
            )}
            {column.orders.map((order) => (
              <Card
                key={order.id}
                order={order}
                fresh={fresh.has(order.id)}
                manager={manager}
                onAdvance={() =>
                  act(() => advanceOrder(order.id, order.status))
                }
                onCancel={(reason) => act(() => cancelAtBar(order.id, reason))}
              />
            ))}
            {column.later && column.later.length > 0 && (
              <details className="mt-2">
                <summary className="min-h-11 cursor-pointer py-2 font-semibold">
                  Later today ({column.later.length})
                </summary>
                <div className="mt-2 grid gap-3">
                  {column.later.map((order) => (
                    <Card
                      key={order.id}
                      order={order}
                      fresh={fresh.has(order.id)}
                      manager={manager}
                      onAdvance={() =>
                        act(() => advanceOrder(order.id, order.status))
                      }
                      onCancel={(reason) =>
                        act(() => cancelAtBar(order.id, reason))
                      }
                    />
                  ))}
                </div>
              </details>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function Card({
  order,
  fresh,
  manager,
  onAdvance,
  onCancel,
}: {
  order: Order;
  fresh: boolean;
  manager: boolean;
  onAdvance: () => void;
  onCancel: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <article
      aria-label={`Order ${order.code}`}
      className={`bg-background rounded-card grid gap-3 border p-4 ${fresh ? "border-star motion-safe:animate-pulse" : "border-border"}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-4xl italic">{order.code}</p>
        <p className="text-right">
          <span className="block font-mono text-lg">
            {order.pickupKind === "asap"
              ? "ASAP"
              : formatTime(new Date(order.windowStart))}
          </span>
          <span className="text-muted-foreground">{order.firstName}</span>
        </p>
      </div>
      {order.payAtPickup && (
        <p className="border-warning text-warning w-fit rounded-full border px-3 py-0.5 text-sm font-semibold">
          Pay at Pickup
        </p>
      )}
      <ul className="grid gap-2">
        {order.lines.map((line, index) => (
          <li key={index}>
            <span className="text-lg font-semibold">
              {line.quantity} x {line.name}
            </span>
            {line.options.length > 0 && (
              <span className="text-muted-foreground block">
                {line.options.join(" · ")}
              </span>
            )}
            {line.note && (
              <span className="bg-warning text-night mt-1 block w-fit rounded px-2 font-semibold">
                {line.note}
              </span>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAdvance}
        className="bg-primary text-primary-foreground min-h-16 rounded-full text-xl font-semibold transition-transform active:scale-[0.98]"
      >
        {order.status === "ready" && order.payAtPickup
          ? "Paid and picked up"
          : STEP[order.status]}
        <span className="sr-only"> {order.code}</span>
      </button>
      {manager && (
        <details>
          <summary className="text-destructive min-h-11 cursor-pointer py-2 font-semibold">
            Cancel {order.code}
          </summary>
          <div className="mt-2 grid gap-2">
            <label htmlFor={`reason-${order.id}`} className="font-semibold">
              Reason (the Customer sees it)
            </label>
            <input
              id={`reason-${order.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-card border-input bg-background min-h-11 border px-3"
            />
            <button
              type="button"
              disabled={!reason.trim()}
              onClick={() => onCancel(reason)}
              className="border-destructive text-destructive min-h-12 rounded-full border font-semibold disabled:opacity-50"
            >
              Cancel this order
            </button>
          </div>
        </details>
      )}
    </article>
  );
}
