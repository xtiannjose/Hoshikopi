"use client";

import {
  createContext,
  use,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { formatPrice } from "@/lib/money";

type Reward = { name: string; discountCents: number } | null;

const RewardContext = createContext<
  [boolean, Dispatch<SetStateAction<boolean>>]
>([false, () => {}]);

/**
 * Whether the Member spends 9 Stars on this Order, shared by the form's
 * checkbox and the summary beside it, so the page shows one total (audit
 * journeys:5).
 */
export function RewardChoice({ children }: { children: ReactNode }) {
  const choice = useState(false);
  return <RewardContext value={choice}>{children}</RewardContext>;
}

export const useRewardChoice = () => use(RewardContext);

/** The total with the Reward taken off. */
export function useTotal(totalCents: number, reward: Reward) {
  const [useReward] = useRewardChoice();
  return totalCents - (useReward && reward ? reward.discountCents : 0);
}

/** The summary's Total, with the free drink's line when it is used.
 * Display only: the server prices the Order again (ADR 0002). */
export function SummaryTotal({
  totalCents,
  reward,
}: {
  totalCents: number;
  reward: Reward;
}) {
  const [useReward] = useRewardChoice();
  const total = useTotal(totalCents, reward);
  return (
    <dl className="border-border mt-4 grid gap-1 border-t pt-3">
      {useReward && reward && (
        <div className="flex justify-between gap-4">
          <dt>Free drink (9 Stars)</dt>
          <dd className="font-mono whitespace-nowrap">
            &minus;{formatPrice(reward.discountCents)}
          </dd>
        </div>
      )}
      <div className="flex justify-between gap-4 text-lg font-semibold">
        <dt>Total</dt>
        <dd className="font-mono whitespace-nowrap">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
