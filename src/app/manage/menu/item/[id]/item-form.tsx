"use client";

import { useActionState } from "react";

import {
  ALLERGEN_LABELS,
  Checkboxes,
  Field,
  fieldClass,
  SaveBar,
} from "@/components/fields";
import { useKeptForm } from "@/components/use-kept-form";

import { saveMenuItemAction, type FormState } from "../../actions";

export type ItemFormData = {
  id: string | null;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  isDrink: boolean;
  isHidden: boolean;
  badges: string[];
  allergens: string[];
  optionGroupIds: string[];
  pairingId: string;
  calories: string;
  promoPrice: string;
  promoFrom: string;
  promoUntil: string;
  availableUntil: string;
  photoUrl: string | null;
  photoAlt: string;
  sort: number;
};

const BADGES = [
  ["barista_pick", "Day Barista Pick"],
  ["night_pick", "Night Barista Pick"],
  ["new", "New"],
  ["best_seller", "Best seller"],
  ["vegan", "Vegan"],
  ["no_caffeine", "No caffeine"],
] as const;

export function ItemForm({
  item,
  categories,
  optionGroups,
  menuItems,
}: {
  item: ItemFormData;
  categories: { id: string; name: string }[];
  optionGroups: { id: string; name: string }[];
  menuItems: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveMenuItemAction,
    { status: "idle" }
  );
  const form = useKeptForm(action, state);
  const error = (name: string) => state.errors?.[name];
  return (
    <form {...form} className="mt-8 grid max-w-3xl gap-6">
      {item.id && <input type="hidden" name="id" value={item.id} />}
      <Field name="categoryId" label="Category" error={error("categoryId")}>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={item.categoryId}
          className={fieldClass}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        name="name"
        label="Name"
        defaultValue={item.name}
        error={error("name")}
      />
      <Field
        name="slug"
        label="Web address"
        hint="Lowercase words joined by dashes, like hoshi-latte."
        defaultValue={item.slug}
        error={error("slug")}
      />
      <Field
        name="description"
        label="One line about it"
        defaultValue={item.description}
        error={error("description")}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          name="basePrice"
          label="Base Price (PHP)"
          inputMode="decimal"
          defaultValue={item.basePrice}
          error={error("basePrice")}
        />
        <Field
          name="calories"
          label="Calories (kcal, optional)"
          hint="For the choices it starts with. Shown as a concept estimate."
          inputMode="numeric"
          defaultValue={item.calories}
          error={error("calories")}
        />
        <Field
          name="sort"
          label="Order on the menu"
          type="number"
          min={0}
          defaultValue={item.sort}
          error={error("sort")}
        />
      </div>
      <fieldset className="grid gap-4">
        <legend className="font-semibold">Promo (optional)</legend>
        <p className="text-muted-foreground -mt-2 text-sm">
          A lower price on these Manila days; Option prices still add on top.
          Leave all three empty for none.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="promoPrice"
            label="Promo price (PHP)"
            inputMode="decimal"
            defaultValue={item.promoPrice}
            error={error("promoPrice")}
          />
          <Field
            name="promoFrom"
            label="First day"
            type="date"
            defaultValue={item.promoFrom}
            error={error("promoFrom")}
          />
          <Field
            name="promoUntil"
            label="Last day"
            type="date"
            defaultValue={item.promoUntil}
            error={error("promoUntil")}
          />
        </div>
      </fieldset>
      <Field
        name="availableUntil"
        label="On the menu until (optional)"
        hint="For seasonal items: Hidden by itself after this day."
        type="date"
        defaultValue={item.availableUntil}
        error={error("availableUntil")}
      />
      <div className="flex flex-wrap gap-x-6">
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="isDrink"
            defaultChecked={item.isDrink}
            className="size-5"
          />
          A drink (earns a Star, counts toward drink Capacity)
        </label>
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="isHidden"
            defaultChecked={item.isHidden}
            className="size-5"
          />
          Hidden from the menu
        </label>
      </div>
      <Checkboxes
        legend="Badges"
        name="badges"
        options={BADGES}
        checked={item.badges}
        error={error("badges")}
      />
      <Checkboxes
        legend="Allergens it contains"
        name="allergens"
        options={ALLERGEN_LABELS}
        checked={item.allergens}
      />
      <Checkboxes
        legend="Option Groups it offers"
        name="optionGroupIds"
        options={optionGroups.map((g) => [g.id, g.name] as const)}
        checked={item.optionGroupIds}
      />
      <Field
        name="pairingId"
        label="Goes well with"
        hint="Shown on its page with a one-tap Add."
        error={error("pairingId")}
      >
        <select
          id="pairingId"
          name="pairingId"
          defaultValue={item.pairingId}
          aria-describedby="pairingId-hint"
          className={fieldClass}
        >
          <option value="">Nothing</option>
          {menuItems
            .filter((other) => other.id !== item.id)
            .map((other) => (
              <option key={other.id} value={other.id}>
                {other.name}
              </option>
            ))}
        </select>
      </Field>
      <Field
        name="photo"
        label="Photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hint={
          item.photoUrl
            ? `Now: ${item.photoUrl}. Choose a new file to replace it.`
            : "JPEG, PNG or WebP, 4:3, under 2 MB. A concept image (docs/ASSETS.md)."
        }
        error={error("photo")}
      />
      <Field
        name="photoAlt"
        label="Photo description (alt text)"
        hint="Describe the item as a menu would."
        defaultValue={item.photoAlt}
        error={error("photoAlt")}
      />
      <SaveBar
        pending={pending}
        status={state.status}
        label={item.id ? "Save Menu Item" : "Add Menu Item"}
      />
    </form>
  );
}
