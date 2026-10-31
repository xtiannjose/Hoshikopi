"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/modules/identity";
import {
  saveCategory,
  saveMenuItem,
  saveOption,
  saveOptionGroup,
  setMenuItemSoldOut,
  setOptionSoldOut,
  storeMenuPhoto,
  type MenuItemInput,
  type OptionFormInput,
} from "@/modules/menu";

export type FormState = {
  status: "idle" | "saved" | "error";
  errors?: Partial<Record<string, string>>;
};

const text = (form: FormData, name: string) => String(form.get(name) ?? "");
const all = (form: FormData, name: string) =>
  form.getAll(name).map((value) => String(value));

/** Sold Out today or back on: Baristas and Managers (STAFF-03). */
export async function toggleSoldOut(form: FormData) {
  const staff = await requireStaff("barista", "/manage/menu");
  const soldOut = text(form, "soldOut") === "1";
  if (text(form, "kind") === "option") {
    await setOptionSoldOut(text(form, "id"), soldOut, staff);
  } else {
    await setMenuItemSoldOut(text(form, "id"), soldOut, staff);
  }
  updateTag("menu");
}

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
    photoAlt: text(form, "photoAlt"),
    sort: text(form, "sort") || "0",
  };
  let photoUrl: string | undefined;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const stored = await storeMenuPhoto(photo, input.slug || "menu-item");
    if (!stored.ok) return { status: "error", errors: { photo: stored.error } };
    photoUrl = stored.url;
  }
  const result = await saveMenuItem(id, input, staff, photoUrl);
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("menu");
  if (!id) redirect(`/manage/menu/item/${result.id}`);
  return { status: "saved" };
}

export async function saveCategoryAction(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const staff = await requireStaff("manager", "/manage/menu/categories");
  const result = await saveCategory(
    text(form, "id") || null,
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
  return { status: "saved" };
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
  if (!id) redirect(`/manage/menu/options/${result.id}`);
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
