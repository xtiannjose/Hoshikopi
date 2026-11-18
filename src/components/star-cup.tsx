import type { CSSProperties } from "react";

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
// Nine Stars light within about 750 ms (docs/05 section 7): .star-light in
// globals.css turns --light into a 50 ms stagger, or into a place on the
// scroll on Home (audit motion:4).
const lightAt = (index: number) => ({ "--light": index }) as CSSProperties;

/**
 * The Star Card's constellation: nine points that draw a cup, the first
 * `lit` of them gold (docs/05 section 6). It imports no module, so a client
 * form can draw it too (12.4). `stagger` lights the Stars one by one; off,
 * a Star lights the moment it is added.
 */
export function StarCup({
  lit,
  stagger = true,
  className = "",
}: {
  lit: number;
  stagger?: boolean;
  className?: string;
}) {
  const at = (index: number) => (stagger ? lightAt(index) : {});
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Star Card: ${lit} of ${POINTS.length} Stars`}
      className={className}
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
            className={
              on ? "stroke-lit animate-fade-in star-light" : "stroke-input"
            }
            // A lit line draws in once both of its Stars are lit.
            style={on ? at(Math.max(a, b)) : {}}
          />
        );
      })}
      {POINTS.map(([x, y], index) =>
        index < lit ? (
          <g key={index} transform={`translate(${x - 6} ${y - 6}) scale(0.5)`}>
            {/* The Stars light one by one, in the order they draw the cup. */}
            <path
              d={STAR}
              className="fill-star stroke-star-edge animate-pop star-light origin-center [transform-box:fill-box]"
              strokeWidth={1.2}
              style={at(index)}
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
  );
}
