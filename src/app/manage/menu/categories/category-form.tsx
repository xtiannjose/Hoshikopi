"use client";

import { useActionState } from "react";

import { Field, SaveBar } from "@/components/fields";
import { useKeptForm } from "@/components/use-kept-form";

import { saveCategoryAction, type FormState } from "../actions";

export function CategoryForm({
  category,
}: {
  category: {
    id: string | null;
    name: string;
    slug: string;
    isHidden: boolean;
    sort: number;
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveCategoryAction,
    { status: "idle" }
  );
  const form = useKeptForm(action, state);
  const key = category.id ?? "new";
  return (
    <form
      {...form}
      className="border-border grid gap-4 border-b pb-6 sm:grid-cols-[2fr_2fr_1fr] sm:items-end"
    >
      {category.id && <input type="hidden" name="id" value={category.id} />}
      <Field
        id={`name-${key}`}
        name="name"
        label="Name"
        defaultValue={category.name}
        error={state.errors?.name}
      />
      <Field
        id={`slug-${key}`}
        name="slug"
        label="Web address"
        defaultValue={category.slug}
        error={state.errors?.slug}
      />
      <Field
        id={`sort-${key}`}
        name="sort"
        label="Order"
        type="number"
        min={0}
        defaultValue={category.sort}
        error={state.errors?.sort}
      />
      <label className="inline-flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          name="isHidden"
          defaultChecked={category.isHidden}
          className="size-5"
        />
        Hidden
      </label>
      <div className="sm:col-span-2">
        <SaveBar
          pending={pending}
          status={state.status}
          label={category.id ? `Save ${category.name}` : "Add Category"}
        />
      </div>
    </form>
  );
}
