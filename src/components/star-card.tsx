import Link from "next/link";

import { STARS_PER_REWARD } from "@/modules/loyalty";

import { PRIMARY_PILL } from "./panel";
import { StarCup } from "./star-cup";

/** The Star Card: "Nine Stars make a cup" (LOY-02). */
export function StarCard({ balance }: { balance: number }) {
  const rewards = Math.floor(balance / STARS_PER_REWARD);
  const toward = balance % STARS_PER_REWARD;
  const lit = rewards > 0 && toward === 0 ? STARS_PER_REWARD : toward;
  const togo = STARS_PER_REWARD - toward;
  // Side by side only when the card itself has room, not the screen: the
  // Stars page keeps it in a narrow column.
  return (
    <div className="@container">
      {/* A border: the muted fill alone is 1.16:1 on the page (UI2-22). */}
      <div className="bg-muted border-border rounded-card grid gap-4 border p-6 @lg:grid-cols-[12rem_1fr] @lg:items-center">
        <StarCup lit={lit} className="w-48 max-w-full justify-self-center" />
        <div className="grid gap-2">
          <p className="font-display pb-1 text-3xl text-pretty italic">
            Nine Stars make a cup.
          </p>
          {rewards > 0 ? (
            <p className="text-lg font-semibold text-pretty">
              {/* One Reward per Order (docs/03 section 5). */}
              {rewards === 1
                ? "A free drink is ready. Use it at checkout."
                : `${rewards} free drinks are ready. Use one per order at checkout.`}
            </p>
          ) : (
            <p className="text-lg text-pretty">
              {lit} of {STARS_PER_REWARD} Stars.{" "}
              {togo === 1 ? "One drink to go." : `${togo} drinks to go.`}
            </p>
          )}
          <p className="text-muted-foreground text-sm text-pretty">
            Every drink you pick up lights one Star.
          </p>
          {rewards > 0 && (
            <Link
              href="/menu"
              className={`${PRIMARY_PILL} mt-2 justify-self-start`}
            >
              Pick your free drink
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
