import type { RewardChoice } from "@/lib/types";

/** Max points per day (Frog + checklist). */
export const POINTS_PER_PERFECT_DAY = 100;

/**
 * Extra Date with Emon — special study reward (on top of regular girlfriend dates).
 * Cost ≈ one full strong month: 30 × 100 = 3000.
 */
export const EXTRA_DATE_COST = 3000;

/** 1 study point = 1 Tk when she withdraws as cash. */
export const CASH_RATE = 1;
export const CASH_MIN_WITHDRAW = 100;

export const TREAT_COST: Record<
  Exclude<RewardChoice, "cash">,
  number
> = {
  chocolate: 150,
  makeup: 250,
  outfit: 800,
  personal_gift: 1000,
  date_with_emon: EXTRA_DATE_COST,
};

export const REWARD_LABELS: Record<RewardChoice, string> = {
  date_with_emon: "Extra date with Emon",
  chocolate: "Chocolate",
  outfit: "Outfit",
  cash: "Cash (Tk)",
  makeup: "Makeup",
  personal_gift: "Personal gift",
};

export function treatCost(choice: Exclude<RewardChoice, "cash">): number {
  return TREAT_COST[choice];
}
