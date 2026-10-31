import { STARS_PER_REWARD } from "@/modules/loyalty";

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

/** The Star Card: "Nine Stars make a cup" (LOY-02). */
export function StarCard({ balance }: { balance: number }) {
  const rewards = Math.floor(balance / STARS_PER_REWARD);
  const toward = balance % STARS_PER_REWARD;
  const lit = rewards > 0 && toward === 0 ? STARS_PER_REWARD : toward;
  const togo = STARS_PER_REWARD - toward;
  return (
    <div className="bg-muted rounded-card grid gap-4 p-6 sm:grid-cols-[12rem_1fr] sm:items-center">
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
              className={on ? "stroke-lit" : "stroke-input"}
            />
          );
        })}
        {POINTS.map(([x, y], index) =>
          index < lit ? (
            <path
              key={index}
              d={STAR}
              transform={`translate(${x - 6} ${y - 6}) scale(0.5)`}
              className="fill-star stroke-star-edge"
              strokeWidth={1.2}
            />
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
        <p className="font-display pb-1 text-3xl italic">
          Nine Stars make a cup.
        </p>
        {rewards > 0 ? (
          <p className="text-lg font-semibold">
            {rewards === 1
              ? "A free drink is ready."
              : `${rewards} free drinks are ready.`}{" "}
            Use it at checkout.
          </p>
        ) : (
          <p className="text-lg">
            {lit} of {STARS_PER_REWARD} Stars.{" "}
            {togo === 1 ? "One drink to go." : `${togo} drinks to go.`}
          </p>
        )}
        <p className="text-muted-foreground text-sm">
          Every drink you pick up lights one Star.
        </p>
      </div>
    </div>
  );
}
