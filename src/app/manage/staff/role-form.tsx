"use client";

import { useActionState, useState } from "react";

import { setRoleAction, type RoleState } from "./actions";

const SELECT =
  "rounded-card border-input bg-background min-h-11 border px-3 font-medium";
const BUTTON =
  "bg-primary text-primary-foreground min-h-11 rounded-full px-5 font-semibold disabled:opacity-60";

/**
 * Sets one person's role. With `email` it is a Staff row's control, and its
 * result goes to `onResult` (the row may leave the list); without, the "Add
 * Staff" form with an email box and its own status line.
 */
export function RoleForm({
  email,
  name,
  role,
  onResult,
}: {
  email?: string;
  name?: string;
  role?: "barista" | "manager";
  onResult?: (state: RoleState) => void;
}) {
  const [state, action, pending] = useActionState<RoleState, FormData>(
    async (previous, form) => {
      const next = await setRoleAction(previous, form);
      onResult?.(next);
      return next;
    },
    {}
  );
  const [chosen, setChosen] = useState<string>(role ?? "barista");
  const row = email !== undefined;
  return (
    // React resets the form after the action; chosen follows the select back.
    <form
      action={action}
      onReset={() => setChosen(role ?? "barista")}
      className="grid gap-2"
    >
      <div className="flex flex-wrap items-end gap-3">
        {row ? (
          <input type="hidden" name="email" value={email} />
        ) : (
          <div className="grid w-full gap-1.5">
            <label htmlFor="staff-email" className="font-semibold">
              Email they signed in with
            </label>
            <p id="staff-email-hint" className="text-muted-foreground text-sm">
              They need to have signed in once, with email or Google.
            </p>
            <input
              id="staff-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              aria-describedby="staff-email-hint"
              defaultValue={state.ok ? "" : state.email}
              className={`${SELECT} w-full`}
            />
          </div>
        )}
        <div className="grid gap-1.5">
          <label
            htmlFor={row ? `role-${email}` : "staff-role"}
            className={row ? "sr-only" : "font-semibold"}
          >
            {row ? `Role for ${name}` : "Role"}
          </label>
          <select
            id={row ? `role-${email}` : "staff-role"}
            name="role"
            defaultValue={role ?? "barista"}
            onChange={(event) => setChosen(event.target.value)}
            className={SELECT}
          >
            <option value="barista">Barista</option>
            <option value="manager">Manager</option>
            {row && <option value="customer">Member (no staff access)</option>}
          </select>
        </div>
        <button type="submit" disabled={pending} className={BUTTON}>
          {row ? "Save" : "Give role"}
          {row && <span className="sr-only"> role for {name}</span>}
        </button>
      </div>
      {chosen === "customer" && (
        <p className="text-warning text-sm">
          They lose staff access and are signed out now.
        </p>
      )}
      {!onResult && (
        <p role="status" className="text-sm font-semibold">
          {state.message && (
            <span className={state.ok ? "" : "text-destructive"}>
              {state.message}
            </span>
          )}
        </p>
      )}
    </form>
  );
}
