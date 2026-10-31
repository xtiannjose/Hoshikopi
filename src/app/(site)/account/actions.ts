"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { signOut } from "@/modules/identity";

export async function signOutAction() {
  await signOut();
  refresh();
  redirect("/");
}
