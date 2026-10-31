"use client";

import { useActionState } from "react";

import {
  ALLERGEN_LABELS,
  Checkboxes,
  Field,
  SaveBar,
} from "@/components/manage/fields";

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
  return (
    <form action={action} className="mt-6 grid max-w-3xl gap-4">
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
  const key = option.id ?? "new";
  return (
    <form action={action} className="border-border grid gap-4 border-b pb-6">
      {option.id && <input type="hidden" name="id" value={option.id} />}
      <input type="hidden" name="optionGroupId" value={groupId} />
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
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
