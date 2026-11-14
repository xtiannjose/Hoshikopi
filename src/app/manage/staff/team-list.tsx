"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { IconCircle, OUTLINE_PILL, Pill } from "@/components/panel";
import type { StaffMember } from "@/modules/identity";

import { endSessionsAction, type RoleState } from "./actions";
import { RoleForm } from "./role-form";
import { busy } from "@/components/fields";

const ROLE = { barista: "Barista", manager: "Manager" };

const initials = (label: string) =>
  label
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

/** The team, with one status line that outlives a row whose role was taken. */
export function TeamList({
  staff,
  meId,
}: {
  staff: StaffMember[];
  meId: string;
}) {
  const [result, setResult] = useState<RoleState>({});
  const status = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (result.message) status.current?.scrollIntoView({ block: "nearest" });
  }, [result]);
  return (
    <>
      <p ref={status} role="status" className="mt-4 font-semibold">
        {result.message && (
          <span className={result.ok ? "" : "text-destructive"}>
            {result.message}
          </span>
        )}
      </p>
      <ul className="divide-border border-border rounded-card mt-4 divide-y border 2xl:grid 2xl:grid-cols-2 2xl:gap-3 2xl:divide-y-0 2xl:border-0">
        {staff.map((person) => {
          const label = person.name || person.email;
          const me = person.id === meId;
          return (
            <li
              key={person.id}
              aria-label={label}
              className="2xl:rounded-card 2xl:border-border grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start 2xl:border"
            >
              <div className="flex min-w-0 gap-3">
                <IconCircle>
                  <span className="text-sm font-semibold">
                    {initials(label)}
                  </span>
                </IconCircle>
                <div className="min-w-0">
                  <p className="font-semibold">
                    {label}
                    {me && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm break-all">
                    {person.email}
                  </p>
                  <p className="mt-1">
                    <Pill
                      tone={person.role === "manager" ? "primary" : "plain"}
                    >
                      {ROLE[person.role]}
                    </Pill>
                  </p>
                  {me && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Another Manager can change your role.
                    </p>
                  )}
                </div>
              </div>
              {!me && (
                <div className="grid gap-2 md:justify-items-end">
                  {/* A new role remounts the form, so its select shows it. */}
                  <RoleForm
                    key={person.role}
                    email={person.email}
                    name={label}
                    role={person.role}
                    onResult={setResult}
                  />
                  <SignOutEverywhere
                    userId={person.id}
                    label={label}
                    onResult={setResult}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Ends every session of one person, after a second tap. */
function SignOutEverywhere({
  userId,
  label,
  onResult,
}: {
  userId: string;
  label: string;
  onResult: (state: RoleState) => void;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const [, action, pending] = useActionState<RoleState, FormData>(
    async (previous, form) => {
      const next = await endSessionsAction(previous, form);
      onResult(next);
      if (next.ok && details.current) details.current.open = false;
      return next;
    },
    {}
  );
  return (
    <details ref={details} className="text-sm md:text-right">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer py-3 font-semibold">
        Sign out everywhere
        <span className="sr-only"> ({label})</span>
      </summary>
      <form
        action={action}
        className="grid max-w-xs justify-items-start gap-3 pb-2 md:ml-auto md:justify-items-end"
      >
        <p className="text-muted-foreground">
          They are signed out on every phone and computer and can sign in again
          with their email.
        </p>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="label" value={label} />
        <button type="submit" {...busy(pending)} className={OUTLINE_PILL}>
          Yes, sign {label} out
        </button>
      </form>
    </details>
  );
}
