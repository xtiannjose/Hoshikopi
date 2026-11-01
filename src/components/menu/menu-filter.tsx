"use client";

import { useState } from "react";

const TAGS = [
  ["vegan", "Vegan"],
  ["no-caffeine", "No caffeine"],
  ["nut-free", "Nut-free"],
] as const;

/**
 * Search and dietary filters for /menu (MENU-05). The menu stays a
 * prerendered page; this hides the cards and Categories that don't match.
 * Returns how many cards match.
 */
function apply(query: string, tags: string[]): number {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const card of document.querySelectorAll<HTMLElement>(
    "[data-menu-item]"
  )) {
    const cardTags = (card.dataset.tags ?? "").split(" ");
    const match =
      words.every((word) => card.dataset.search?.includes(word)) &&
      tags.every((tag) => cardTags.includes(tag));
    card.hidden = !match;
    if (match) shown++;
  }
  for (const section of document.querySelectorAll<HTMLElement>(
    "[data-menu-section]"
  )) {
    section.hidden = !section.querySelector("[data-menu-item]:not([hidden])");
  }
  return shown;
}

export function MenuFilter() {
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [shown, setShown] = useState<number | null>(null);
  const update = (nextQuery: string, nextTags: string[]) => {
    setQuery(nextQuery);
    setTags(nextTags);
    const filtering = nextQuery.trim() !== "" || nextTags.length > 0;
    const count = apply(nextQuery, nextTags);
    setShown(filtering ? count : null);
  };
  return (
    <search className="grid gap-3">
      <label htmlFor="menu-search" className="font-semibold">
        Search the menu
      </label>
      <input
        id="menu-search"
        type="search"
        value={query}
        onChange={(event) => update(event.target.value, tags)}
        placeholder="Ube, latte, chocolate..."
        className="rounded-card border-input bg-background min-h-11 max-w-md border px-3"
      />
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Dietary filters</legend>
        {TAGS.map(([tag, label]) => (
          <label
            key={tag}
            className="border-input has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-ring inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
          >
            <input
              type="checkbox"
              checked={tags.includes(tag)}
              onChange={(event) =>
                update(
                  query,
                  event.target.checked
                    ? [...tags, tag]
                    : tags.filter((t) => t !== tag)
                )
              }
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </fieldset>
      <p aria-live="polite" className="min-h-6">
        {shown === 0 && "Nothing matches. Try fewer filters or another word."}
        {shown !== null &&
          shown > 0 &&
          `${shown} ${shown === 1 ? "item matches" : "items match"}.`}
      </p>
    </search>
  );
}
