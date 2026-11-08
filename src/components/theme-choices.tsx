"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { THEME_KEY, type ThemeChoice } from "./theme";

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
  const apply = () => {
    if (choice === "auto") {
      (window as { hoshikopiTheme?: () => void }).hoshikopiTheme?.();
    } else {
      document.documentElement.dataset.theme = choice;
    }
  };
  // Day and Night crossfade where the browser can (reduced motion: at once).
  if (document.startViewTransition) document.startViewTransition(apply);
  else apply();
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

/** The choice itself; the icons come rendered from ThemeSwitch (7.6). */
export function ThemeChoices({
  name,
  choices,
}: {
  name: string;
  choices: { value: ThemeChoice; label: string; icon: ReactNode }[];
}) {
  const current = useSyncExternalStore(subscribe, read, () => "auto");
  return (
    <fieldset className="border-input inline-flex rounded-full border p-0.5">
      <legend className="sr-only">Colours</legend>
      {choices.map(({ value, label, icon }) => (
        <label
          key={value}
          title={label}
          className="has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-ring relative grid size-9 cursor-pointer place-items-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
        >
          <input
            type="radio"
            name={name}
            value={value}
            checked={current === value}
            onChange={() => choose(value)}
            className="sr-only"
          />
          {icon}
          <span className="sr-only">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
