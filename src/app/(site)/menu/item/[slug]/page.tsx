import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, InfoIcon } from "@phosphor-icons/react/ssr";

import { Badges } from "@/components/menu/badges";
import { Photo, type PhotoKind } from "@/components/photo";
import { PickupLine } from "@/components/pickup-line";
import { formatPrice } from "@/lib/money";
import { getMenuItem, menuSlugs, type Pairing } from "@/modules/menu";

import { OptionPicker } from "./option-picker";
import { PairingAdd } from "./pairing-add";

export async function generateStaticParams() {
  const { items } = await menuSlugs();
  return items.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/menu/item/[slug]">): Promise<Metadata> {
  const item = await getMenuItem((await params).slug);
  if (!item) return {};
  return {
    title: item.name,
    description: `${item.description} ${formatPrice(item.baseCents)}.`,
  };
}

const KITCHEN_NOTE =
  "Our kitchen also handles milk, egg, wheat, soy and tree nuts.";

// params are read inside Suspense so a path outside generateStaticParams
// (or one revalidated later) can serve the shell first (Partial Prefetching).
export default function MenuItemPage({
  params,
}: PageProps<"/menu/item/[slug]">) {
  return (
    <main
      id="main"
      className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 pt-4 md:grid-cols-2 md:gap-12 md:px-8"
    >
      <Suspense
        fallback={
          <div className="bg-muted rounded-card aspect-4/3 md:col-start-1" />
        }
      >
        <MenuItemDetails params={params} />
      </Suspense>
    </main>
  );
}

async function MenuItemDetails({
  params,
}: Pick<PageProps<"/menu/item/[slug]">, "params">) {
  const item = await getMenuItem((await params).slug);
  if (!item) notFound();
  return (
    <>
      <div>
        <Link
          href={`/menu/${item.categorySlug}`}
          className="inline-flex min-h-11 items-center gap-2 no-underline hover:underline"
        >
          <ArrowLeftIcon aria-hidden size={18} />
          {item.categoryName}
        </Link>
        <Photo
          src={item.photoUrl}
          alt={item.photoAlt}
          kind={item.categorySlug as PhotoKind}
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
          className={`rounded-card mt-2 aspect-4/3 ${item.soldOut ? "opacity-50 grayscale" : ""}`}
        />
      </div>
      <div className="md:pt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-display pb-1 text-4xl leading-[1.1] italic md:text-5xl">
            {item.name}
          </h1>
          <p className="shrink-0 font-mono text-lg">
            {item.soldOut ? "Sold out today" : formatPrice(item.baseCents)}
          </p>
        </div>
        <div className="mt-3">
          <Badges labels={item.badges} picks={item.picks} />
        </div>
        <p className="mt-4 text-lg">{item.description}</p>
        <p className="text-muted-foreground mt-4 flex gap-2 font-mono text-sm">
          <InfoIcon aria-hidden size={18} className="mt-0.5 shrink-0" />
          <span>
            {item.allergenLine} {KITCHEN_NOTE}
          </span>
        </p>
        {item.calorieKcal !== null && (
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            About {item.calorieKcal} kcal with the choices it starts with. A
            concept estimate.
          </p>
        )}
        <div className="mt-4">
          <PickupLine />
        </div>
        {item.soldOut ? (
          <p className="bg-muted rounded-card mt-8 p-4">
            Sold out today. Back tomorrow, salamat for understanding!
          </p>
        ) : (
          <OptionPicker
            menuItemId={item.id}
            name={item.name}
            baseCents={item.baseCents}
            groups={item.optionGroups}
          />
        )}
        {item.pairing && <PairingCard pairing={item.pairing} />}
      </div>
    </>
  );
}

/** "Goes well with" (MENU-08). */
function PairingCard({ pairing }: { pairing: Pairing }) {
  return (
    <section
      aria-labelledby="pairing"
      className="border-border mt-10 grid grid-cols-[6rem_1fr] gap-x-4 gap-y-3 border-t pt-6"
    >
      <h2
        id="pairing"
        className="font-display col-span-2 pb-1 text-2xl leading-[1.1] italic"
      >
        Goes well with
      </h2>
      <Photo
        src={pairing.photoUrl}
        alt={pairing.photoAlt}
        kind={pairing.categorySlug as PhotoKind}
        sizes="6rem"
        className="rounded-card aspect-square"
      />
      <div className="grid content-start gap-1">
        <Link href={`/menu/item/${pairing.slug}`} className="font-semibold">
          {pairing.name}
        </Link>
        <span className="font-mono">
          {pairing.soldOut ? "Sold out today" : formatPrice(pairing.baseCents)}
        </span>
        {!pairing.soldOut &&
          (pairing.optionIds ? (
            <PairingAdd
              menuItemId={pairing.id}
              name={pairing.name}
              optionIds={pairing.optionIds}
            />
          ) : (
            <Link href={`/menu/item/${pairing.slug}`}>Choose yours</Link>
          ))}
      </div>
    </section>
  );
}
