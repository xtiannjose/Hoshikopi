"use client";

import { useActionState } from "react";

import {
  ALLERGEN_LABELS,
  Checkboxes,
  Field,
  SaveBar,
} from "@/components/fields";
import { useKeptForm } from "@/components/use-kept-form";

import {
  saveOptionAction,
  saveOptionGroupAction,
  type FormState,
} from "../../actions";

export function GroupForm({
  group,
}: {
  group: {
    id: string | null;
    name: string;
    minSelect: number;
    maxSelect: number;
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveOptionGroupAction,
    { status: "idle" }
  );
  const form = useKeptForm(action, state);
  return (
    <form {...form} className="grid max-w-3xl gap-4">
      {group.id && <input type="hidden" name="id" value={group.id} />}
      <Field
        name="name"
        label="Name"
        defaultValue={group.name}
        error={state.errors?.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="minSelect"
          label="Least picks (0 makes it optional)"
          type="number"
          min={0}
          defaultValue={group.minSelect}
          error={state.errors?.minSelect}
        />
        <Field
          name="maxSelect"
          label="Most picks (1 means one choice)"
          type="number"
          min={1}
          defaultValue={group.maxSelect}
          error={state.errors?.maxSelect}
        />
      </div>
      <SaveBar
        pending={pending}
        status={state.status}
        label={group.id ? "Save Option Group" : "Add Option Group"}
      />
    </form>
  );
}

export function OptionForm({
  groupId,
  option,
}: {
  groupId: string;
  option: {
    id: string | null;
    name: string;
    priceDelta: string;
    isDefault: boolean;
    addsAllergens: string[];
    sort: number;
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveOptionAction,
    { status: "idle" }
  );
  const form = useKeptForm(action, state);
  const key = option.id ?? "new";
  return (
    <form
      {...form}
      className={`@container grid gap-4 ${option.id ? "rounded-card border-border border p-5 md:p-6" : ""}`}
    >
      {option.id && <input type="hidden" name="id" value={option.id} />}
      <input type="hidden" name="optionGroupId" value={groupId} />
      {option.id && (
        <h3 className="font-display pb-1 text-2xl italic">{option.name}</h3>
      )}
      <div className="grid gap-4 @lg:grid-cols-[2fr_1fr_1fr] @lg:items-end">
        <Field
          id={`name-${key}`}
          name="name"
          label="Option"
          defaultValue={option.name}
          error={state.errors?.name}
        />
        <Field
          id={`delta-${key}`}
          name="priceDelta"
          label="Price Delta (PHP)"
          hint="0 for no change. It is added to the Base Price."
          inputMode="decimal"
          defaultValue={option.priceDelta}
          error={state.errors?.priceDelta}
        />
        <Field
          id={`sort-${key}`}
          name="sort"
          label="Order"
          type="number"
          min={0}
          defaultValue={option.sort}
          error={state.errors?.sort}
        />
      </div>
      <label className="inline-flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={option.isDefault}
          className="size-5"
        />
        Picked by default
      </label>
      <Checkboxes
        legend="Allergens it adds"
        name="addsAllergens"
        options={ALLERGEN_LABELS}
        checked={option.addsAllergens}
      />
      <SaveBar
        pending={pending}
        status={state.status}
        label={option.id ? `Save ${option.name}` : "Add Option"}
      />
    </form>
  );
}
