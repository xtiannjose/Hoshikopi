import { ALLERGENS } from "@/lib/menu-labels";

// The same labels as the Staff form, lowercased for a sentence (audit
// architecture:17).
const NAMES = new Map<string, string>(
  ALLERGENS.map(([key, label]) => [key, label.toLowerCase()])
);

const list = (values: string[]) => {
  const names = values.map((value) => NAMES.get(value) ?? value);
  return names.length < 2
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};

/**
 * "Contains: milk. Almond milk adds tree nuts." Options that only add what
 * the Menu Item already contains are left out (MENU-07).
 */
export function allergenLine(
  allergens: string[],
  groups: { options: { name: string; addsAllergens: string[] }[] }[]
): string {
  const sentences = [
    allergens.length ? `Contains: ${list(allergens)}.` : "No common allergens.",
  ];
  for (const option of groups.flatMap((group) => group.options)) {
    const extra = option.addsAllergens.filter((a) => !allergens.includes(a));
    if (extra.length) sentences.push(`${option.name} adds ${list(extra)}.`);
  }
  return sentences.join(" ");
}

/** True when the Menu Item gets the "Contains nuts" badge (MENU-01). */
export function containsNuts(allergens: string[]): boolean {
  return allergens.includes("peanuts") || allergens.includes("tree_nuts");
}
