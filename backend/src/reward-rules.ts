export type RewardChoice =
  | "date_with_emon"
  | "chocolate"
  | "outfit"
  | "cash"
  | "makeup"
  | "personal_gift";

/**
 * Points bank: each day max 100 pts.
 * Extra Date with Emon = one full strong month (~30 × 100) = 3000 pts.
 * Cash: 1 point = 1 Tk.
 */
export const POINTS_PER_PERFECT_DAY = 100;
export const EXTRA_DATE_COST = 3000; // ~1 full month of 100-pt days
export const CASH_MIN_WITHDRAW = 100; // Tk / points
export const CASH_RATE = 1; // 1 point = 1 Tk

/** Fixed-price treats (cash uses custom amount). */
export const TREAT_COST: Partial<Record<RewardChoice, number>> = {
  chocolate: 150,
  makeup: 250,
  outfit: 800,
  personal_gift: 1000,
  date_with_emon: EXTRA_DATE_COST,
};

export function monthKeyFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function costForClaim(
  choice: RewardChoice,
  cashAmount?: number,
): { ok: true; points: number; tk?: number } | { ok: false; error: string } {
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
  const cost = TREAT_COST[choice];
  if (cost == null) {
    return { ok: false, error: "Unknown reward." };
  }
  return { ok: true, points: cost };
}
