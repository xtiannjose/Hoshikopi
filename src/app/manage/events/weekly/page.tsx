import type { Metadata } from "next";
import { Suspense } from "react";
import { PlusIcon, RepeatIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { weeklyWhen } from "@/components/content/weekly-list";
import { PageHeader } from "@/components/page-header";
import { Empty, Panel, Pill } from "@/components/panel";
import { recurringForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

import { WeeklyForm } from "./weekly-form";

export const metadata: Metadata = { title: "Recurring Events" };

export default function ManageWeeklyPage() {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <div className="grid gap-8">
        <PageHeader
          back={<BackLink href="/manage/events">Events</BackLink>}
          title="Recurring Events"
          size="staff"
          intro="Weekly, with no date or sign-up. They show on the Events and cafe pages; untick Shown on the site to pause one."
        />
        <Suspense fallback={<p>Loading...</p>}>
          <List />
        </Suspense>
      </div>
    </main>
  );
}

async function List() {
  await requireStaff("manager", "/manage/events/weekly");
  const events = await recurringForStaff();
  return (
    <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
      {events.length === 0 && (
        <Empty icon={<RepeatIcon size={24} />}>
          <p>
            Nothing weekly yet. An open mic or a Saturday cupping gives regulars
            a standing date.
          </p>
          <a href="#add-weekly" className="font-semibold">
            Add one
          </a>
        </Empty>
      )}
      {events.map((event) => (
        <Panel
          key={event.id}
          id={`weekly-${event.id}`}
          title={weeklyWhen(event)}
          icon={<RepeatIcon size={20} />}
          aside={
            !event.isPublished && <Pill tone="muted">Not on the site</Pill>
          }
        >
          <WeeklyForm event={event} />
        </Panel>
      ))}
      <Panel
        id="add-weekly"
        title="Add a Recurring Event"
        icon={<PlusIcon size={20} />}
      >
        <WeeklyForm
          event={{
            id: null,
            title: "",
            weekday: 1,
            startsAt: "18:00",
            endsAt: "19:00",
            note: "",
            isPublished: true,
          }}
        />
      </Panel>
    </div>
  );
}
