import { connection } from "next/server";

import { formatTime, now } from "@/lib/clock";
import { nextPickupTimes } from "@/modules/ordering";

const STAR =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/** Keeps the card's height while the times load, so nothing jumps. */
export const PICKUP_SPACE = "min-h-24";

/**
 * The hero pickup card's Pickup Times (docs/05 section 6, audit UI2-05):
 * the soonest in the italic serif and the next ones as rings on the dashed
 * thread, the soonest a gold star. Read only: the time is chosen at
 * checkout, where Capacity is checked. Read at request time, in Suspense.
 */
export async function PickupPreview() {
  await connection();
  const next = await nextPickupTimes(now());
  if (next.kind === "closed") return null;
  if (next.kind === "paused") {
    return (
      <p className="text-warning font-semibold">
        Ordering is paused until {formatTime(next.until)}.
      </p>
    );
  }
  const [soonest] = next.times;
  if (!soonest) return null;
  return (
    <div className="grid gap-2">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-muted-foreground">Order now, pick up at</span>
        <span className="font-display text-3xl italic">
          {formatTime(soonest)}
        </span>
      </p>
      <ol
        aria-label="Next Pickup Times"
        className="relative flex flex-wrap gap-x-4 gap-y-2"
      >
        {next.times.map((time, index) => (
          <li
            key={time.toISOString()}
            className="inline-flex items-center gap-1.5 font-mono text-sm"
          >
            <span className="grid size-5 place-items-center" aria-hidden>
              {index === 0 ? (
                <svg viewBox="0 0 24 24" className="size-5">
                  <path
                    d={STAR}
                    className="fill-star stroke-star-edge"
                    strokeWidth="1"
                  />
                </svg>
              ) : (
                <span className="border-input size-3 rounded-full border-[1.5px]" />
              )}
            </span>
            {formatTime(time)}
          </li>
        ))}
      </ol>
    </div>
  );
}
