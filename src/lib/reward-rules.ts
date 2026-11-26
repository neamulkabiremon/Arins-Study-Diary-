import type { RewardChoice, UserRole } from "@/lib/types";

/** Max points per perfect day (all tasks done). */
export const POINTS_PER_PERFECT_DAY = 100;

/**
 * Extra study-date cost ≈ one full strong month: 30 × 100 = 3000.
 * Regular girlfriend dates stay separate — this is earned.
 */
export const EXTRA_DATE_COST = 3000;

/** 1 study point = 1 Tk when withdrawing as cash. */
export const CASH_RATE = 1;
export const CASH_MIN_WITHDRAW = 100;

/** Arin's challenge catalog — higher costs so rewards feel earned. */
export const ARIN_TREAT_COST: Record<
  Exclude<RewardChoice, "cash" | "date_with_arin">,
  number
> = {
  chocolate: 150,
  makeup: 1000,
  outfit: 2000,
  personal_gift: 1000,
  date_with_emon: EXTRA_DATE_COST,
};

/** Emon's catalog — earn points studying, claim a date with Arin. */
export const EMON_TREAT_COST: Record<
  Extract<RewardChoice, "date_with_arin">,
  number
> = {
  date_with_arin: EXTRA_DATE_COST,
};

/** @deprecated use ARIN_TREAT_COST — kept for older imports */
export const TREAT_COST = ARIN_TREAT_COST;

export const REWARD_LABELS: Record<RewardChoice, string> = {
  date_with_emon: "Extra date with Emon",
  date_with_arin: "Date with Arin",
  chocolate: "Chocolate",
  outfit: "Outfit",
  cash: "Cash (Tk)",
  makeup: "Makeup",
  personal_gift: "Personal gift",
};

export function treatCost(
  choice: Exclude<RewardChoice, "cash">,
  role: UserRole = "arin",
): number {
  if (role === "emon") {
    if (choice === "date_with_arin") return EMON_TREAT_COST.date_with_arin;
    throw new Error("That reward is only for Arin");
  }
  if (choice === "date_with_arin") {
    throw new Error("That reward is only for Emon");
  }
  return ARIN_TREAT_COST[choice];
}

export function isDateChoice(choice: RewardChoice): boolean {
  return choice === "date_with_emon" || choice === "date_with_arin";
}

export function dateChoiceForRole(role: UserRole): RewardChoice {
  return role === "emon" ? "date_with_arin" : "date_with_emon";
}
