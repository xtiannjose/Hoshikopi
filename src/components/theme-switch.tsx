"use client";

import { useSyncExternalStore } from "react";

import { THEME_KEY, type ThemeChoice } from "./theme";

const CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "day", label: "Day" },
  { value: "night", label: "Night" },
];

const listeners = new Set<() => void>();

function read(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "day" || saved === "night" ? saved : "auto";
  } catch {
    return "auto";
  }
}

function choose(choice: ThemeChoice) {
  try {
    if (choice === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // shortcut: with storage blocked a pinned choice lasts until the next
    // minute's clock check; fine for private windows.
  }
  if (choice === "auto") {
    (window as { hoshikopiTheme?: () => void }).hoshikopiTheme?.();
  } else {
    document.documentElement.dataset.theme = choice;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Auto follows the cafe's clock; Day or Night pins one (ADR 0010). */
export function ThemeSwitch({ name }: { name: string }) {
  const current = useSyncExternalStore(subscribe, read, () => "auto");
  return (
    <fieldset className="border-input inline-flex rounded-full border p-0.5">
      <legend className="sr-only">Colours</legend>
      {CHOICES.map(({ value, label }) => (
        <label
          key={value}
          className="has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-ring relative grid min-h-9 min-w-14 cursor-pointer place-items-center rounded-full px-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
        >
          <input
            type="radio"
            name={name}
            value={value}
            checked={current === value}
            onChange={() => choose(value)}
            className="sr-only"
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
