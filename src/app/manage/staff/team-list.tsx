"use client";

import { useState } from "react";

import type { StaffMember } from "@/modules/identity";

import { endSessionsAction, type RoleState } from "./actions";
import { RoleForm } from "./role-form";

const ROLE = { barista: "Barista", manager: "Manager" };

/** The team, with one status line that outlives a row whose role was taken. */
export function TeamList({
  staff,
  meId,
}: {
  staff: StaffMember[];
  meId: string;
}) {
  const [result, setResult] = useState<RoleState>({});
  return (
    <>
      <p role="status" className="mt-4 font-semibold">
        {result.message && (
          <span className={result.ok ? "" : "text-destructive"}>
            {result.message}
          </span>
        )}
      </p>
      <ul className="divide-border border-border rounded-card mt-4 divide-y border">
        {staff.map((person) => {
          const label = person.name || person.email;
          return (
            <li
              key={person.id}
              aria-label={label}
              className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {label}
                  {person.id === meId && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground text-sm break-all">
                  {person.email}
                </p>
                <p className="mt-1 text-sm">{ROLE[person.role]}</p>
              </div>
              {person.id !== meId && (
                <div className="grid gap-2 md:justify-items-end">
                  <RoleForm
                    email={person.email}
                    name={label}
                    role={person.role}
                    onResult={setResult}
                  />
                  <form action={endSessionsAction}>
                    <input type="hidden" name="userId" value={person.id} />
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-foreground min-h-11 text-sm font-semibold underline underline-offset-4"
                    >
                      Sign out everywhere
                      <span className="sr-only"> ({label})</span>
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
