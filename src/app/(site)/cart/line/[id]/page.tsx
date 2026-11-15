import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { currentCartOwner, getCart } from "@/modules/cart";
import { getMenuItem } from "@/modules/menu";

import { OptionPicker } from "../../../menu/item/[slug]/option-picker";

export const metadata: Metadata = {
  title: "Change your order",
  robots: { index: false },
};

/** One Cart Line's Options, quantity and note (PRD ORD-02, audit journeys:14). */
export default function ChangeLinePage({
  params,
}: PageProps<"/cart/line/[id]">) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-3xl">
        <Suspense fallback={<p className="mt-6">Getting your Cart...</p>}>
          <ChangeLine params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function ChangeLine({
  params,
}: Pick<PageProps<"/cart/line/[id]">, "params">) {
  const { id } = await params;
  const owner = await currentCartOwner();
  const line = owner
    ? (await getCart(owner)).lines.find((l) => l.id === id)
    : undefined;
  const item =
    line && line.problem === null ? await getMenuItem(line.slug) : null;
  if (!line || !item) notFound();
  return (
    <>
      <PageHeader
        back={<BackLink href="/cart">Your Cart</BackLink>}
        title={`Change your ${item.name}`}
      />
      <OptionPicker
        icons={{
          minus: <MinusIcon aria-hidden size={18} />,
          plus: <PlusIcon aria-hidden size={18} />,
          check: <CheckIcon size={18} weight="bold" />,
        }}
        menuItemId={item.id}
        name={item.name}
        baseCents={item.baseCents}
        groups={item.optionGroups}
        categorySlug={item.categorySlug}
        categoryName={item.categoryName}
        editing={{
          lineId: line.id,
          optionIds: line.options.map((option) => option.id),
          quantity: line.quantity,
          note: line.note,
        }}
      />
    </>
  );
}
