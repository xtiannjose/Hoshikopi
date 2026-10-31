import { formatDate } from "@/lib/clock";
import { formatClock, type Hours } from "@/lib/hours";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const range = (opens: string, closes: string) =>
  `${formatClock(opens)} to ${formatClock(closes)}`;

/** Opening Hours, folded to "Every day" when every day is the same. */
export function HoursList({ hours }: { hours: Hours }) {
  const [first] = hours.weekly;
  const same = hours.weekly.every(
    (d) =>
      !d.isClosed &&
      d.opensAt === first.opensAt &&
      d.closesAt === first.closesAt &&
      d.lastOrderAt === first.lastOrderAt
  );
  return (
    <div className="grid gap-4">
      {same ? (
        <p>
          Every day, {range(first.opensAt, first.closesAt)}
          <span className="text-muted-foreground block">
            Last order {formatClock(first.lastOrderAt)}
          </span>
        </p>
      ) : (
        <dl className="grid grid-cols-[4rem_1fr] gap-y-1">
          {hours.weekly.map((d) => (
            <div key={d.weekday} className="contents">
              <dt className="font-semibold">{DAYS[d.weekday]}</dt>
              <dd>
                {d.isClosed
                  ? "Closed"
                  : `${range(d.opensAt, d.closesAt)}, last order ${formatClock(d.lastOrderAt)}`}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {hours.special.length > 0 && (
        <div>
          <h3 className="font-semibold">Special Hours</h3>
          <ul className="mt-1 grid gap-1">
            {hours.special.map((s) => (
              <li key={s.day}>
                <span className="font-mono text-sm">
                  {formatDate(new Date(`${s.day}T04:00:00Z`))}
                </span>{" "}
                {s.isClosed || !s.opensAt || !s.closesAt
                  ? "Closed"
                  : range(s.opensAt, s.closesAt)}
                {s.note && `, ${s.note}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
