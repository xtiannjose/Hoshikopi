import { StarIcon } from "@phosphor-icons/react/ssr";

/** Menu Item badges; Barista Pick carries the gold star (MENU-01). */
export function Badges({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Badges">
      {labels.map((label) => (
        <li
          key={label}
          className="border-border inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
        >
          {label === "Barista Pick" && (
            <StarIcon
              aria-hidden
              size={12}
              weight="fill"
              className="text-star"
            />
          )}
          {label}
        </li>
      ))}
    </ul>
  );
}
