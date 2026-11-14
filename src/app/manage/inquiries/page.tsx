import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ChatCircleTextIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  PackageIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import {
  Empty,
  IconCircle,
  OUTLINE_PILL,
  Pill,
  PRIMARY_PILL,
} from "@/components/panel";
import { formatDate, formatTime, manilaInstant } from "@/lib/clock";
import { inquiriesForStaff, type InquiryView } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

import { inquiryStatusAction } from "./actions";

export const metadata: Metadata = { title: "Inquiries" };

const KIND = {
  private_event: {
    label: "Private event",
    icon: <UsersThreeIcon size={20} />,
  },
  large_order: { label: "Large order", icon: <PackageIcon size={20} /> },
};
const STATUS = {
  new: <Pill tone="warning">New</Pill>,
  answered: <Pill tone="success">Answered</Pill>,
  closed: <Pill tone="muted">Closed</Pill>,
};
// What the card says after its status changed, by the status it has now.
const DONE = {
  new: "Reopened.",
  answered: "Marked answered.",
  closed: "Closed.",
};
const NEXT: Record<InquiryView["status"], [InquiryView["status"], string][]> = {
  new: [
    ["answered", "Mark answered"],
    ["closed", "Close"],
  ],
  answered: [["closed", "Close"]],
  closed: [["new", "Reopen"]],
};

export default function ManageInquiriesPage({
  searchParams,
}: PageProps<"/manage/inquiries">) {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <div className="grid gap-8">
        <PageHeader
          back={<BackLink href="/manage">Manage</BackLink>}
          title="Inquiries"
          size="staff"
          intro="Private events and large Orders from the Visit page. Reply by email, then mark them answered."
        />
        <Suspense fallback={<p>Loading...</p>}>
          <List searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function List({
  searchParams,
}: Pick<PageProps<"/manage/inquiries">, "searchParams">) {
  await requireStaff("manager", "/manage/inquiries");
  const [inquiries, { done }] = await Promise.all([
    inquiriesForStaff(),
    searchParams,
  ]);
  if (inquiries.length === 0) {
    return (
      <Empty icon={<ChatCircleTextIcon size={24} />}>
        <p>
          No inquiries yet. They arrive from Send us an inquiry on the Visit
          page.
        </p>
        <Link href="/cafe/inquire" className={OUTLINE_PILL}>
          See the inquiry form
        </Link>
      </Empty>
    );
  }
  const by = (status: InquiryView["status"]) =>
    inquiries.filter((i) => i.status === status);
  const fresh = by("new");
  const answered = by("answered");
  const closed = by("closed");
  const cards = (list: InquiryView[]) => (
    <ul className="grid gap-3 xl:grid-cols-2 xl:items-start">
      {list.map((inquiry) => (
        <Card key={inquiry.id} inquiry={inquiry} done={done === inquiry.id} />
      ))}
    </ul>
  );
  return (
    <div className="grid gap-10">
      <section aria-labelledby="waiting" className="grid gap-4">
        <h2 id="waiting" className="font-display text-2xl italic">
          Waiting for a reply
        </h2>
        {fresh.length > 0 ? (
          cards(fresh)
        ) : (
          <p className="text-muted-foreground">All caught up. Salamat!</p>
        )}
      </section>
      {answered.length > 0 && (
        <section aria-labelledby="answered" className="grid gap-4">
          <h2 id="answered" className="font-display text-2xl italic">
            Answered
          </h2>
          {cards(answered)}
        </section>
      )}
      {closed.length > 0 && (
        <section aria-labelledby="closed" className="grid gap-4">
          <h2 id="closed" className="font-display text-2xl italic">
            Closed
          </h2>
          {/* Open when the one just closed is inside, so the link lands on it. */}
          <details open={closed.some((i) => i.id === done)}>
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">
              Show {closed.length} closed
            </summary>
            <div className="mt-4">{cards(closed)}</div>
          </details>
        </section>
      )}
    </div>
  );
}

function Card({ inquiry, done }: { inquiry: InquiryView; done: boolean }) {
  const kind = KIND[inquiry.kind];
  return (
    <li
      id={`inquiry-${inquiry.id}`}
      tabIndex={-1}
      className="rounded-card border-border grid scroll-mt-6 gap-3 border p-5"
    >
      <div className="flex items-start gap-3">
        <IconCircle>{kind.icon}</IconCircle>
        <div className="grid min-w-0 gap-0.5">
          <h3 className="text-lg font-semibold">
            {kind.label} from {inquiry.name}
          </h3>
          <p className="text-muted-foreground font-mono text-sm">
            {formatDate(inquiry.createdAt)} {formatTime(inquiry.createdAt)}
          </p>
        </div>
        <span className="ml-auto">{STATUS[inquiry.status]}</span>
      </div>
      <p className="break-words">
        <a href={`mailto:${encodeURIComponent(inquiry.email)}`}>
          {inquiry.email}
        </a>
        {inquiry.wantedOn &&
          `, for ${formatDate(manilaInstant(inquiry.wantedOn, 12 * 60))}`}
        {inquiry.guests && `, ${inquiry.guests} guests or drinks`}
      </p>
      <p className="max-w-measure whitespace-pre-line">{inquiry.message}</p>
      {done && (
        <p className="text-success flex items-center gap-2 font-semibold">
          <CheckCircleIcon aria-hidden size={20} />
          {DONE[inquiry.status]}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {inquiry.status === "new" && (
          <a
            href={`mailto:${encodeURIComponent(inquiry.email)}?subject=Your%20Hoshikopi%20inquiry`}
            className={PRIMARY_PILL}
          >
            <EnvelopeSimpleIcon aria-hidden size={18} />
            Reply by email
            <span className="sr-only"> ({inquiry.name})</span>
          </a>
        )}
        {NEXT[inquiry.status].map(([status, label]) => (
          <form key={status} action={inquiryStatusAction}>
            <input type="hidden" name="id" value={inquiry.id} />
            <input type="hidden" name="status" value={status} />
            {/* Not inline-flex: the hidden name must stay "Mark answered (Lia)". */}
            <button
              type="submit"
              className="border-input hover:bg-muted min-h-11 rounded-full border px-5 font-semibold"
            >
              {label}
              <span className="sr-only"> ({inquiry.name})</span>
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}
