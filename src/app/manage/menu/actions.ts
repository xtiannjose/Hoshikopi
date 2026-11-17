"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/modules/identity";
import {
  deleteOptionGroup,
  saveCategory,
  saveMenuItemWithPhoto,
  saveOption,
  saveOptionGroup,
  type MenuItemInput,
  type OptionFormInput,
} from "@/modules/menu";

export type FormState = {
  status: "idle" | "saved" | "error";
  errors?: Partial<Record<string, string>>;
  /** A new Category's id, for the next step after adding it. */
  id?: string;
};

const text = (form: FormData, name: string) => String(form.get(name) ?? "");
const all = (form: FormData, name: string) =>
  form.getAll(name).map((value) => String(value));

export async function saveMenuItemAction(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const staff = await requireStaff("manager", "/manage/menu");
  const id = text(form, "id") || null;
  const input: MenuItemInput = {
    categoryId: text(form, "categoryId"),
    name: text(form, "name"),
    slug: text(form, "slug"),
    description: text(form, "description"),
    basePrice: text(form, "basePrice"),
    isDrink: form.get("isDrink") ?? undefined,
    isHidden: form.get("isHidden") ?? undefined,
    badges: all(form, "badges") as MenuItemInput["badges"],
    allergens: all(form, "allergens") as MenuItemInput["allergens"],
    optionGroupIds: all(form, "optionGroupIds"),
    pairingId: text(form, "pairingId"),
    calories: text(form, "calories"),
    promoPrice: text(form, "promoPrice"),
    promoFrom: text(form, "promoFrom"),
    promoUntil: text(form, "promoUntil"),
    availableUntil: text(form, "availableUntil"),
    photoAlt: text(form, "photoAlt"),
    sort: text(form, "sort") || "0",
  };
  // The photo is checked first and stored only once the save passes.
  const photo = form.get("photo");
  const result = await saveMenuItemWithPhoto(
    id,
    input,
    staff,
    photo instanceof File ? photo : null
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("menu");
  // A new item whose photo failed to store says so on its page; the redirect
  // dropped the error (audit DC-16).
  if (!id) {
    redirect(
      `/manage/menu/item/${result.id}?added=1${result.photoError ? "&photo=failed" : ""}`
    );
  }
  if (result.photoError) {
    return { status: "error", errors: { photo: result.photoError } };
  }
  return { status: "saved" };
}

export async function saveCategoryAction(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const staff = await requireStaff("manager", "/manage/menu/categories");
  const id = text(form, "id") || null;
  const result = await saveCategory(
    id,
    {
      name: text(form, "name"),
      slug: text(form, "slug"),
      isHidden: form.get("isHidden") ?? undefined,
      sort: text(form, "sort") || "0",
    },
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("menu");
  return { status: "saved", id: id ? undefined : result.id };
}

export async function saveOptionGroupAction(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const staff = await requireStaff("manager", "/manage/menu");
  const id = text(form, "id") || null;
  const result = await saveOptionGroup(
    id,
    {
      name: text(form, "name"),
      minSelect: text(form, "minSelect"),
      maxSelect: text(form, "maxSelect"),
    },
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("menu");
  if (!id) redirect(`/manage/menu/options/${result.id}?added=1`);
  return { status: "saved" };
}

export async function saveOptionAction(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const staff = await requireStaff("manager", "/manage/menu");
  const result = await saveOption(
    text(form, "id") || null,
    {
      optionGroupId: text(form, "optionGroupId"),
      name: text(form, "name"),
      priceDelta: text(form, "priceDelta"),
      isDefault: form.get("isDefault") ?? undefined,
      isHidden: form.get("isHidden") ?? undefined,
      addsAllergens: all(
        form,
        "addsAllergens"
      ) as OptionFormInput["addsAllergens"],
      sort: text(form, "sort") || "0",
    },
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("menu");
  return { status: "saved" };
}

/** Deletes an Option Group no Menu Item offers (audit staff:9). */
export async function deleteOptionGroupAction(form: FormData) {
  const staff = await requireStaff("manager", "/manage/menu");
  if (await deleteOptionGroup(text(form, "id"), staff)) {
    updateTag("menu");
    redirect("/manage/menu");
  }
}
