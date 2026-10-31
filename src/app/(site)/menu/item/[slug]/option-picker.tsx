"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";

import { formatDelta, formatPrice } from "@/lib/money";
import type { OptionGroupView } from "@/modules/menu";

import { addToCartAction, type AddState } from "./actions";

const MAX_QUANTITY = 20;

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
 * (MENU-02); Add to order sends the choices only, and the server prices
 * the Line (ORD-01, ORD-06).
 */
export function OptionPicker({
  menuItemId,
  name,
  baseCents,
  groups,
}: {
  menuItemId: string;
  name: string;
  baseCents: number;
  groups: OptionGroupView[];
}) {
  const [picked, setPicked] = useState(() => initialPicks(groups));
  const [quantity, setQuantity] = useState(1);
  const [state, action, pending] = useActionState<AddState, FormData>(
    addToCartAction,
    { status: "idle" }
  );
  const chosen = new Set(Object.values(picked).flat());
  const unit = groups
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
      action={action}
      aria-label={`Choose your ${name}`}
      className="mt-8 grid gap-6"
    >
      <input type="hidden" name="menuItemId" value={menuItemId} />
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
      <div className="grid gap-1.5">
        <label htmlFor="note" className="font-semibold">
          Note for the barista{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="note"
          name="note"
          maxLength={140}
          placeholder="less ice please"
          className="rounded-card border-input bg-background min-h-11 border px-3"
        />
      </div>
      <div className="border-border grid gap-4 border-t pt-4">
        <p aria-live="polite" className="text-lg">
          Your {name}:{" "}
          <span className="font-mono font-semibold">
            {formatPrice(unit * quantity)}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Quantity"
            className="flex items-center gap-1"
          >
            <button
              type="button"
              aria-label="One less"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="border-input grid size-11 place-items-center rounded-full border disabled:opacity-40"
            >
              <MinusIcon aria-hidden size={18} />
            </button>
            <span
              aria-live="polite"
              className="w-8 text-center font-mono text-lg"
            >
              {quantity}
            </span>
            <input type="hidden" name="quantity" value={quantity} />
            <button
              type="button"
              aria-label="One more"
              disabled={quantity >= MAX_QUANTITY}
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              className="border-input grid size-11 place-items-center rounded-full border disabled:opacity-40"
            >
              <PlusIcon aria-hidden size={18} />
            </button>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="bg-primary text-primary-foreground min-h-12 flex-1 rounded-full px-6 font-semibold transition-transform active:scale-[0.98] disabled:opacity-60 sm:flex-none"
          >
            {pending ? "Adding..." : "Add to order"}
          </button>
        </div>
        <p role="status" className="min-h-6">
          {state.status === "added" && (
            <>
              Added to your order. Salamat!{" "}
              <Link href="/cart" className="font-semibold">
                See your Cart
              </Link>
            </>
          )}
          {state.status === "error" && (
            <span className="text-destructive">{state.message}</span>
          )}
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
