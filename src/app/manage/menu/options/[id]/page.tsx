import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";
import { CheckCircleIcon, PlusIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { formatDelta, formatReceipt } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { getMenuForStaff, itemsOfferingGroup } from "@/modules/menu";

import { GroupForm, OptionForm } from "./option-forms";

export const metadata: Metadata = { title: "Option Group" };

const back = <BackLink href="/manage/menu">Menu</BackLink>;

export default function OptionGroupPage({
  params,
  searchParams,
}: PageProps<"/manage/menu/options/[id]">) {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <Suspense
        fallback={
          <>
            {back}
            <p className="mt-4">Loading...</p>
          </>
        }
      >
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Editor({
  params,
  searchParams,
}: Pick<PageProps<"/manage/menu/options/[id]">, "params" | "searchParams">) {
  await requireStaff("manager", "/manage/menu");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (id === "new") {
    return (
      <>
        <PageHeader size="staff" back={back} title="Add an Option Group" />
        <div className="mt-8">
          <GroupForm
            group={{ id: null, name: "", minSelect: 1, maxSelect: 1 }}
          />
        </div>
      </>
    );
  }
  const [menu, offeredBy] = await Promise.all([
    getMenuForStaff(),
    itemsOfferingGroup(id),
  ]);
  const group = menu.optionGroups.find((g) => g.id === id);
  if (!group) notFound();
  return (
    <>
      <PageHeader size="staff" back={back} title={group.name} />
      {query.added === "1" && (
        <p className="bg-muted rounded-card mt-6 flex max-w-3xl items-center gap-3 p-4">
          <CheckCircleIcon
            aria-hidden
            size={20}
            className="text-success shrink-0"
          />
          Added. Now add its Options below, then tick it on each Menu Item that
          offers it.
        </p>
      )}
      <dl className="rounded-card border-border mt-6 grid max-w-3xl gap-4 border p-5">
        <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="font-semibold">Offered by</dt>
          <dd className="max-w-measure">
            {offeredBy.length === 0
              ? "No Menu Item offers this yet. Open a Menu Item and tick it under Option Groups it offers."
              : offeredBy.map((item, i) => (
                  <Fragment key={item.id}>
                    {i > 0 && ", "}
                    <Link href={`/manage/menu/item/${item.id}`}>
                      {item.name}
                    </Link>
                  </Fragment>
                ))}
          </dd>
        </div>
        <div className="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="font-semibold">Customers see</dt>
          <dd>
            {group.options.length === 0 ? (
              "Nothing yet. Add an Option below."
            ) : (
              <ul className="flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <li
                    key={option.id}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                      option.isDefault
                        ? "bg-primary text-primary-foreground border-primary"
                        : option.soldOut
                          ? "border-border text-muted-foreground"
                          : "border-input"
                    }`}
                  >
                    {option.name} {formatDelta(option.deltaCents)}
                    {option.soldOut && (
                      <span className="sr-only"> (sold out today)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-10">
        <GroupForm group={group} />
      </div>
      <h2 className="font-display mt-14 pb-1 text-3xl italic">Options</h2>
      <div className="mt-6 grid gap-6 xl:grid-cols-2 xl:items-start">
        {group.options.map((option) => (
          <OptionForm
            key={option.id}
            groupId={group.id}
            option={{ ...option, priceDelta: formatReceipt(option.deltaCents) }}
          />
        ))}
        <Panel
          id="add-option"
          headingLevel={3}
          title="Add an Option"
          icon={<PlusIcon size={20} />}
        >
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
        </Panel>
      </div>
    </>
  );
}
