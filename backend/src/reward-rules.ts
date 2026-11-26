export type RewardChoice =
  | "date_with_emon"
  | "date_with_arin"
  | "chocolate"
  | "outfit"
  | "cash"
  | "makeup"
  | "personal_gift";

export type UserRole = "arin" | "emon";

/**
 * Points bank: each day max 100 pts.
 * Extra study-date = one full strong month (~30 × 100) = 3000 pts.
 * Cash: 1 point = 1 Tk.
 */
export const POINTS_PER_PERFECT_DAY = 100;
export const EXTRA_DATE_COST = 3000;
export const CASH_MIN_WITHDRAW = 100;
export const CASH_RATE = 1;

/** Arin's challenge catalog. */
export const ARIN_TREAT_COST: Partial<Record<RewardChoice, number>> = {
  chocolate: 150,
  makeup: 1000,
  outfit: 2000,
  personal_gift: 1000,
  date_with_emon: EXTRA_DATE_COST,
};

/** Emon earns a date with Arin. */
export const EMON_TREAT_COST: Partial<Record<RewardChoice, number>> = {
  date_with_arin: EXTRA_DATE_COST,
};

export const TREAT_COST = ARIN_TREAT_COST;

export function monthKeyFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function isDateChoice(choice: RewardChoice): boolean {
  return choice === "date_with_emon" || choice === "date_with_arin";
}

export function allowedChoicesForRole(role: UserRole): RewardChoice[] {
  if (role === "emon") return ["date_with_arin"];
  return [
    "date_with_emon",
    "chocolate",
    "makeup",
    "outfit",
    "personal_gift",
    "cash",
  ];
}

export function costForClaim(
  choice: RewardChoice,
  cashAmount?: number,
  role: UserRole = "arin",
): { ok: true; points: number; tk?: number } | { ok: false; error: string } {
  const allowed = allowedChoicesForRole(role);
  if (!allowed.includes(choice)) {
    return { ok: false, error: "That reward is not available for your account." };
  }

  if (choice === "cash") {
    const amount = cashAmount ?? 0;
    if (!Number.isInteger(amount) || amount < CASH_MIN_WITHDRAW) {
      return {
        ok: false,
        error: `Cash withdraw minimum is ${CASH_MIN_WITHDRAW} points (= ${CASH_MIN_WITHDRAW} Tk).`,
      };
    }
    return { ok: true, points: amount, tk: amount * CASH_RATE };
  }

  const table = role === "emon" ? EMON_TREAT_COST : ARIN_TREAT_COST;
  const cost = table[choice];
  if (cost == null) {
    return { ok: false, error: "Unknown reward." };
  }
  return { ok: true, points: cost };
}
