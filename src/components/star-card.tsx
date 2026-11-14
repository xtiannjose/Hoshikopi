import Link from "next/link";

import { STARS_PER_REWARD } from "@/modules/loyalty";

import { PRIMARY_PILL } from "./panel";

// Nine points that draw a cup (docs/05 section 6): the rim, the handle,
// then down the body. They light in this order.
const POINTS: [number, number][] = [
  [18, 28],
  [72, 28],
  [82, 38],
  [92, 52],
  [82, 64],
  [68, 62],
  [60, 84],
  [30, 84],
  [22, 58],
];
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [1, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 0],
];
const STAR =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";
// Nine Stars light within about 750 ms (docs/05 section 7).
const lightAt = (index: number) => `${index * 50}ms`;

/** The Star Card: "Nine Stars make a cup" (LOY-02). */
export function StarCard({ balance }: { balance: number }) {
  const rewards = Math.floor(balance / STARS_PER_REWARD);
  const toward = balance % STARS_PER_REWARD;
  const lit = rewards > 0 && toward === 0 ? STARS_PER_REWARD : toward;
  const togo = STARS_PER_REWARD - toward;
  // Side by side only when the card itself has room, not the screen: the
  // Stars page keeps it in a narrow column.
  return (
    <div className="@container">
      <div className="bg-muted rounded-card grid gap-4 p-6 @lg:grid-cols-[12rem_1fr] @lg:items-center">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Star Card: ${lit} of ${STARS_PER_REWARD} Stars`}
          className="w-48 justify-self-center"
        >
          {EDGES.map(([a, b]) => {
            const on = a < lit && b < lit;
            return (
              <line
                key={`${a}-${b}`}
                x1={POINTS[a][0]}
                y1={POINTS[a][1]}
                x2={POINTS[b][0]}
                y2={POINTS[b][1]}
                strokeWidth={on ? 1.6 : 1}
                strokeDasharray={on ? undefined : "2 2"}
                className={on ? "stroke-lit animate-fade-in" : "stroke-input"}
                // A lit line draws in once both of its Stars are lit.
                style={on ? { animationDelay: lightAt(Math.max(a, b)) } : {}}
              />
            );
          })}
          {POINTS.map(([x, y], index) =>
            index < lit ? (
              <g
                key={index}
                transform={`translate(${x - 6} ${y - 6}) scale(0.5)`}
              >
                {/* The Stars light one by one, in the order they draw the cup. */}
                <path
                  d={STAR}
                  className="fill-star stroke-star-edge animate-pop origin-center [transform-box:fill-box]"
                  strokeWidth={1.2}
                  style={{ animationDelay: lightAt(index) }}
                />
              </g>
            ) : (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={2.6}
                strokeWidth={1}
                className="fill-muted stroke-input"
              />
            )
          )}
        </svg>
        <div className="grid gap-2">
          <p className="font-display pb-1 text-3xl text-pretty italic">
            Nine Stars make a cup.
          </p>
          {rewards > 0 ? (
            <p className="text-lg font-semibold text-pretty">
              {/* One Reward per Order (docs/03 section 5). */}
              {rewards === 1
                ? "A free drink is ready. Use it at checkout."
                : `${rewards} free drinks are ready. Use one per order at checkout.`}
            </p>
          ) : (
            <p className="text-lg text-pretty">
              {lit} of {STARS_PER_REWARD} Stars.{" "}
              {togo === 1 ? "One drink to go." : `${togo} drinks to go.`}
            </p>
          )}
          <p className="text-muted-foreground text-sm text-pretty">
            Every drink you pick up lights one Star.
          </p>
          {rewards > 0 && (
            <Link
              href="/menu"
              className={`${PRIMARY_PILL} mt-2 justify-self-start`}
            >
              Pick your free drink
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
