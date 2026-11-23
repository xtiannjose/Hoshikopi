"use client";

import {
  busyAction,
  endBusyAction,
  pauseAction,
  resumeAction,
} from "../manage/hours/actions";

// A Manager's Pause and Busy Mode taps on the Bar Screen, apart from the
// board itself (audit architecture:18). Each form says it came from /bar,
// so after the Second Factor's 12 hours the code page brings the Manager
// back here, not to Hours and Capacity (audit DC-12).

const FROM_BAR = <input type="hidden" name="from" value="/bar" />;
const OUTLINE = "border-input min-h-12 rounded-full border px-5 font-semibold";

export function ManagerControls({
  paused,
  busy,
  onDone,
}: {
  paused: boolean;
  busy: boolean;
  /** Called on submit, so the board catches up a moment later. */
  onDone: () => void;
}) {
  return (
    <>
      {paused ? (
        <form action={resumeAction} onSubmit={onDone}>
          {FROM_BAR}
          <button
            type="submit"
            className="bg-primary text-primary-foreground min-h-12 rounded-full px-5 font-semibold"
          >
            Resume ordering
          </button>
        </form>
      ) : (
        <form action={pauseAction} onSubmit={onDone}>
          {FROM_BAR}
          <input type="hidden" name="minutes" value="30" />
          <input
            type="hidden"
            name="message"
            value="The bar is swamped. Back in 30 minutes, salamat."
          />
          <button
            type="submit"
            className="border-warning text-warning min-h-12 rounded-full border px-5 font-semibold"
          >
            Pause ordering 30 min
          </button>
        </form>
      )}
      {!paused &&
        (busy ? (
          <form action={endBusyAction} onSubmit={onDone}>
            {FROM_BAR}
            <button type="submit" className={OUTLINE}>
              End Busy Mode
            </button>
          </form>
        ) : (
          // A rush the queue can't see (walk-ins): longer, honest times
          // instead of pausing (8.4).
          <div
            role="group"
            aria-label="Busy Mode"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                [10, 30],
                [15, 60],
              ] as const
            ).map(([minutes, forMinutes]) => (
              <form key={minutes} action={busyAction} onSubmit={onDone}>
                {FROM_BAR}
                <input type="hidden" name="minutes" value={minutes} />
                <input type="hidden" name="forMinutes" value={forMinutes} />
                <button type="submit" className={OUTLINE}>
                  Busy +{minutes} min,{" "}
                  {forMinutes === 60 ? "1 hour" : `${forMinutes} min`}
                </button>
              </form>
            ))}
          </div>
        ))}
    </>
  );
}
