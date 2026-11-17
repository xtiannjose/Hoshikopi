"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { busy, Field, fieldClass } from "@/components/fields";
import { OUTLINE_PILL, PRIMARY_PILL_LG } from "@/components/panel";
import { StarCup } from "@/components/star-cup";
import { useKeptForm } from "@/components/use-kept-form";

import {
  adjustStarsAction,
  findMemberStarsAction,
  type MemberStars,
  type StarsState,
} from "./actions";

/** Up to 50 Stars at a time, either way (the ledger's limit). */
const MAX = 50;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Every field is held in state, so the form never resets itself.
const KEEP = { status: "kept" };
const STEP =
  "border-input bg-background grid size-11 shrink-0 place-items-center rounded-full border disabled:opacity-40";

// Numbers in the mono face, as prices are: "0" read as "O" in the body face.
const starCount = (n: number) => (
  <>
    <span className="font-mono tabular-nums">{n}</span>{" "}
    {n === 1 ? "Star" : "Stars"}
  </>
);

export function StarsForm({
  perReward,
  icons,
}: {
  /** Stars one free drink costs. */
  perReward: number;
  icons: { minus: ReactNode; plus: ReactNode };
}) {
  const [state, action, pending] = useActionState<StarsState, FormData>(
    adjustStarsAction,
    {}
  );
  const form = useKeptForm(action, KEEP);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [stars, setStars] = useState("");
  const [reason, setReason] = useState("");
  // The last Member looked up, by the email they were found with.
  const [found, setFound] = useState<{
    email: string;
    member: MemberStars | null;
  } | null>(null);
  const [looking, startLooking] = useTransition();
  const latest = useRef("");

  // A save clears the Stars and reason and moves the card to the new
  // balance; a refusal still shows the balance it was checked against.
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) {
      setStars("");
      setReason("");
    }
    const balance = state.balance;
    if (balance !== undefined) {
      setFound((f) =>
        f?.member ? { ...f, member: { ...f.member, balance } } : f
      );
    }
  }

  // Look the Member up once a whole email is typed (12.4).
  useEffect(() => {
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) return undefined;
    const timer = setTimeout(() => {
      latest.current = value;
      startLooking(async () => {
        const member = await findMemberStarsAction(value);
        if (latest.current === value) setFound({ email: value, member });
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [email]);

  const typed = email.trim().toLowerCase();
  // undefined: not looked up yet; null: nobody has that email.
  const member = found?.email === typed ? found.member : undefined;
  const delta = /^-?\d+$/.test(stars.trim()) ? Number(stars) : 0;
  const after = member ? member.balance + delta : undefined;
  const step = (by: number) =>
    setStars(String(Math.max(-MAX, Math.min(MAX, delta + by))));

  return (
    <form {...form} className="grid gap-5">
      <Field
        name="email"
        label="Member's email"
        aria-invalid={state.field === "email" || undefined}
      >
        {(control) => (
          <input
            ref={emailRef}
            {...control}
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className={fieldClass}
          />
        )}
      </Field>

      {member ? (
        <MemberCard
          member={member}
          delta={delta}
          after={after!}
          perReward={perReward}
        />
      ) : (
        <p aria-live="polite" className="text-muted-foreground text-sm">
          {member === null
            ? "No Member has that email yet."
            : looking
              ? "Looking for the Member..."
              : "Their Star Card shows here once you type their email."}
        </p>
      )}

      <Field
        name="stars"
        label="Stars to add or remove"
        hint="Tap plus or minus, or type a number (a minus removes). Up to 50 at a time."
        aria-invalid={state.field === "stars" || undefined}
      >
        {(control) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="One Star less"
              disabled={delta <= -MAX || (after !== undefined && after <= 0)}
              onClick={() => step(-1)}
              className={STEP}
            >
              {icons.minus}
            </button>
            <input
              {...control}
              type="number"
              inputMode="numeric"
              min={-MAX}
              max={MAX}
              required
              value={stars}
              onChange={(e) => setStars(e.currentTarget.value)}
              className={`${fieldClass} max-w-28 [appearance:textfield] text-center font-mono text-lg tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
            <button
              type="button"
              aria-label="One Star more"
              disabled={delta >= MAX}
              onClick={() => step(1)}
              className={STEP}
            >
              {icons.plus}
            </button>
          </div>
        )}
      </Field>
      <Field
        name="reason"
        label="Reason"
        hint="The Member sees this in their Star history, so write it for them. For example: Sorry about the wait, a Star on us."
        required
        maxLength={120}
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value)}
      />
      <button
        type="submit"
        {...busy(pending)}
        className={`${PRIMARY_PILL_LG} justify-self-start`}
      >
        {pending ? "Saving..." : "Save adjustment"}
      </button>
      <p role="status" className="font-semibold">
        {state.message && (
          <span className={state.ok ? "" : "text-destructive"}>
            {state.message}
          </span>
        )}
      </p>
      {state.ok && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => {
              setEmail("");
              setFound(null);
              emailRef.current?.focus();
            }}
            className={OUTLINE_PILL}
          >
            Adjust another Member
          </button>
          <Link href="/manage/reports">See Reports</Link>
        </div>
      )}
    </form>
  );
}

/**
 * The Member's Star Card as it will be after the save: the cup lights and
 * dims as the Manager taps plus and minus (12.4).
 */
function MemberCard({
  member,
  delta,
  after,
  perReward,
}: {
  member: MemberStars;
  delta: number;
  after: number;
  perReward: number;
}) {
  const shown = Math.max(after, 0);
  const rewards = Math.floor(shown / perReward);
  const toward = shown % perReward;
  const lit = rewards > 0 && toward === 0 ? perReward : toward;
  return (
    <div className="@container">
      <div className="bg-muted border-border rounded-card grid gap-4 border p-5 @md:grid-cols-[9rem_1fr] @md:items-center">
        <StarCup
          lit={lit}
          stagger={false}
          className="w-36 max-w-full justify-self-center"
        />
        <div className="grid min-w-0 gap-1">
          <p className="font-display pb-1 text-2xl break-words italic">
            {member.name || member.email}
          </p>
          {member.name && (
            <p className="text-muted-foreground text-sm break-all">
              {member.email}
            </p>
          )}
          <p aria-live="polite" className="mt-2 text-lg text-pretty">
            {starCount(member.balance)} now
            {delta !== 0 && (
              <>
                ,{" "}
                <span
                  className={`font-semibold ${after < 0 ? "text-destructive" : ""}`}
                >
                  {after < 0 ? (
                    "below zero after the save"
                  ) : (
                    <>{starCount(after)} after you save</>
                  )}
                </span>
              </>
            )}
            .
          </p>
          <p className="text-muted-foreground text-sm text-pretty">
            {rewards > 0
              ? rewards === 1
                ? "A free drink is ready."
                : `${rewards} free drinks are ready.`
              : `${perReward - toward} more for a free drink.`}
          </p>
        </div>
      </div>
    </div>
  );
}
