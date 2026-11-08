"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";

import { Field, fillSlug, SaveBar } from "@/components/fields";
import { useKeptForm } from "@/components/use-kept-form";

import { saveCategoryAction, type FormState } from "../actions";

export function CategoryForm({
  category,
  items = 0,
}: {
  category: {
    id: string | null;
    name: string;
    slug: string;
    isHidden: boolean;
    sort: number;
  };
  /** How many Menu Items it holds, for the legend. */
  items?: number;
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
      className={`@container grid gap-4 ${category.id ? "rounded-card border-border border p-5 md:p-6" : ""}`}
    >
      {category.id && <input type="hidden" name="id" value={category.id} />}
      <fieldset className="grid gap-4">
        {category.id && (
          <legend className="font-display mb-2 pb-1 text-2xl italic">
            {category.name}{" "}
            <span className="text-muted-foreground font-sans text-sm not-italic">
              {items} {items === 1 ? "item" : "items"}
            </span>
          </legend>
        )}
        <div className="grid gap-4 @xl:grid-cols-[3fr_3fr_2fr] @xl:items-end">
          <Field
            id={`name-${key}`}
            name="name"
            label="Name"
            defaultValue={category.name}
            onBlur={category.id ? undefined : fillSlug}
            error={state.errors?.name}
          />
          <Field
            id={`slug-${key}`}
            name="slug"
            label="Web address"
            hint="Lowercase words joined by dashes, like all-day-food."
            defaultValue={category.slug}
            error={state.errors?.slug}
          />
          <Field
            id={`sort-${key}`}
            name="sort"
            label="Order"
            hint="Lower numbers come first."
            type="number"
            min={0}
            defaultValue={category.sort}
            error={state.errors?.sort}
          />
        </div>
        <div className="grid gap-1">
          <label className="inline-flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              name="isHidden"
              defaultChecked={category.isHidden}
              aria-describedby={`hidden-${key}-hint`}
              className="size-5"
            />
            Hidden
          </label>
          <p
            id={`hidden-${key}-hint`}
            className="text-muted-foreground text-sm"
          >
            Takes the whole Category and its items off the menu.
          </p>
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SaveBar
          pending={pending}
          status={state.status}
          label={category.id ? `Save ${category.name}` : "Add Category"}
        />
        {category.id && !category.isHidden && (
          <Link href={`/menu/${category.slug}`} className="text-sm">
            See it on the site
            <span className="sr-only"> ({category.name})</span>
          </Link>
        )}
      </div>
      {!category.id && state.status === "saved" && state.id && (
        <p className="bg-muted rounded-card flex flex-wrap items-center gap-x-3 gap-y-1 p-4">
          <CheckCircleIcon aria-hidden size={20} className="text-success" />
          Added. It&apos;s in the list now.
          <Link
            href={`/manage/menu/item/new?category=${state.id}`}
            className="font-semibold"
          >
            Add an item to it
          </Link>
        </p>
      )}
    </form>
  );
}
