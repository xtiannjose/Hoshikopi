"use client";

import { useState } from "react";

import { formatDelta, formatPrice } from "@/lib/money";
import type { OptionGroupView } from "@/modules/menu";

type Picked = Record<string, string[]>;

function initialPicks(groups: OptionGroupView[]): Picked {
  const picked: Picked = {};
  for (const group of groups) {
    const available = group.options.filter((option) => !option.soldOut);
    let ids = available
      .filter((option) => option.isDefault)
      .slice(0, group.maxSelect);
    // A required group with its default Sold Out starts on the first left.
    if (ids.length < group.minSelect) {
      ids = available.slice(0, group.minSelect);
    }
    picked[group.id] = ids.map((option) => option.id);
  }
  return picked;
}

/**
 * Option Groups as native radios and checkboxes with the running price
 * (MENU-02). The server prices again when the Line is added (ORD-06).
 */
export function OptionPicker({
  name,
  baseCents,
  groups,
}: {
  name: string;
  baseCents: number;
  groups: OptionGroupView[];
}) {
  const [picked, setPicked] = useState(() => initialPicks(groups));
  const chosen = new Set(Object.values(picked).flat());
  const total = groups
    .flatMap((group) => group.options)
    .filter((option) => chosen.has(option.id))
    .reduce((sum, option) => sum + option.deltaCents, baseCents);

  const pickOne = (groupId: string, optionId: string | null) =>
    setPicked((prev) => ({ ...prev, [groupId]: optionId ? [optionId] : [] }));
  const toggle = (groupId: string, optionId: string, on: boolean) =>
    setPicked((prev) => ({
      ...prev,
      [groupId]: on
        ? [...prev[groupId], optionId]
        : prev[groupId].filter((id) => id !== optionId),
    }));

  return (
    <form
      aria-label={`Choose your ${name}`}
      className="mt-8 grid gap-6"
      onSubmit={(event) => event.preventDefault()}
    >
      {groups.map((group) =>
        group.maxSelect === 1 ? (
          <fieldset key={group.id}>
            <legend className="font-semibold">
              {group.name}
              {group.minSelect === 0 && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  (optional)
                </span>
              )}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.minSelect === 0 && (
                <Chip
                  type="radio"
                  name={`option-${group.id}`}
                  label="None"
                  checked={picked[group.id].length === 0}
                  onChange={() => pickOne(group.id, null)}
                />
              )}
              {group.options.map((option) => (
                <Chip
                  key={option.id}
                  type="radio"
                  name={`option-${group.id}`}
                  value={option.id}
                  label={option.name}
                  delta={formatDelta(option.deltaCents)}
                  soldOut={option.soldOut}
                  checked={picked[group.id].includes(option.id)}
                  onChange={() => pickOne(group.id, option.id)}
                />
              ))}
            </div>
          </fieldset>
        ) : (
          <fieldset key={group.id}>
            <legend className="font-semibold">
              {group.name}
              <span className="text-muted-foreground font-normal">
                {" "}
                (up to {group.maxSelect})
              </span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.options.map((option) => {
                const checked = picked[group.id].includes(option.id);
                return (
                  <Chip
                    key={option.id}
                    type="checkbox"
                    name={`option-${group.id}`}
                    value={option.id}
                    label={option.name}
                    delta={formatDelta(option.deltaCents)}
                    soldOut={option.soldOut}
                    full={
                      !checked && picked[group.id].length >= group.maxSelect
                    }
                    checked={checked}
                    onChange={(on) => toggle(group.id, option.id, on)}
                  />
                );
              })}
            </div>
          </fieldset>
        )
      )}
      <div className="border-border flex flex-wrap items-baseline justify-between gap-2 border-t pt-4">
        <p aria-live="polite" className="text-lg">
          Your {name}:{" "}
          <span className="font-mono font-semibold">{formatPrice(total)}</span>
        </p>
        <p className="text-muted-foreground text-sm">
          Ordering ahead opens soon.
        </p>
      </div>
    </form>
  );
}

function Chip({
  type,
  name,
  value,
  label,
  delta,
  soldOut = false,
  full = false,
  checked,
  onChange,
}: {
  type: "radio" | "checkbox";
  name: string;
  value?: string;
  label: string;
  delta?: string;
  soldOut?: boolean;
  full?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="border-input has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary has-[:disabled]:text-muted-foreground has-[:focus-visible]:outline-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
      <input
        type={type}
        name={name}
        value={value ?? ""}
        checked={checked}
        disabled={soldOut || full}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span>{label}</span>
      {soldOut ? (
        <span className="text-sm">Sold out today</span>
      ) : (
        delta && <span className="font-mono text-sm">{delta}</span>
      )}
    </label>
  );
}
