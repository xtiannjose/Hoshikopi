import { StarIcon } from "@phosphor-icons/react/ssr";

const badgeClass =
  "border-border items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium";

/**
 * Menu Item badges (MENU-01). Barista Pick carries the gold star and shows
 * in the palette it was picked for (INFO-13); pages stay prerendered, so
 * CSS chooses.
 */
export function Badges({
  labels,
  picks,
}: {
  labels: string[];
  picks: { day: boolean; night: boolean };
}) {
  if (labels.length === 0 && !picks.day && !picks.night) return null;
  const pick = (
    <>
      <StarIcon aria-hidden size={12} weight="fill" className="text-star" />
      Barista Pick
    </>
  );
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Badges">
      {picks.day && (
        <li className={`${badgeClass} night:hidden inline-flex`}>{pick}</li>
      )}
      {picks.night && (
        <li className={`${badgeClass} night:inline-flex hidden`}>{pick}</li>
      )}
      {labels.map((label) => (
        <li key={label} className={`${badgeClass} inline-flex`}>
          {label}
        </li>
      ))}
    </ul>
  );
}
