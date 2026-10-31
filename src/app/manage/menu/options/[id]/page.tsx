import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { formatReceipt } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { getMenuForStaff } from "@/modules/menu";

import { GroupForm, OptionForm } from "./option-forms";

export const metadata: Metadata = { title: "Option Group" };

export default function OptionGroupPage({
  params,
}: PageProps<"/manage/menu/options/[id]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage/menu">Back to the menu</Link>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <Editor params={params} />
      </Suspense>
    </main>
  );
}

async function Editor({
  params,
}: Pick<PageProps<"/manage/menu/options/[id]">, "params">) {
  await requireStaff("manager", "/manage/menu");
  const { id } = await params;
  if (id === "new") {
    return (
      <>
        <h1 className="font-display mt-4 pb-1 text-4xl italic">
          Add an Option Group
        </h1>
        <GroupForm group={{ id: null, name: "", minSelect: 1, maxSelect: 1 }} />
      </>
    );
  }
  const group = (await getMenuForStaff()).optionGroups.find((g) => g.id === id);
  if (!group) notFound();
  return (
    <>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">{group.name}</h1>
      <GroupForm group={group} />
      <h2 className="font-display mt-12 text-2xl italic">Options</h2>
      <div className="mt-4 grid gap-6">
        {group.options.map((option) => (
          <OptionForm
            key={option.id}
            groupId={group.id}
            option={{ ...option, priceDelta: formatReceipt(option.deltaCents) }}
          />
        ))}
        <h3 className="font-semibold">Add an Option</h3>
        <OptionForm
          groupId={group.id}
          option={{
            id: null,
            name: "",
            priceDelta: "0",
            isDefault: false,
            addsAllergens: [],
            sort: group.options.length,
          }}
        />
      </div>
    </>
  );
}
