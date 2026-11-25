"use client";

import { useState } from "react";
import { MotivationalBanner } from "@/components/today/MotivationalBanner";
import { PointsWalletCard } from "@/components/rewards/PointsWalletCard";
import {
  RewardPicker,
  type CashClaimExtras,
} from "@/components/rewards/RewardPicker";
import { WeeklyProgress } from "@/components/rewards/WeeklyProgress";
import { apiClaimReward, hasApiBaseUrl } from "@/lib/api";
import { REWARD_LABELS } from "@/lib/reward-rules";
import { weekDayStrings } from "@/lib/dates";
import { useDiary } from "@/lib/diary-store";
import type { RewardChoice } from "@/lib/types";

export function RewardsView() {
  const {
    todayDate,
    score,
    weekly,
    notes,
    claimReward,
    refreshRewards,
    demoMode,
  } = useDiary();
  const weekDays = weekDayStrings(todayDate);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimOk, setClaimOk] = useState<string | null>(null);

  async function onClaim(
    choice: RewardChoice,
    amount?: number,
    extras?: CashClaimExtras,
  ) {
    setClaimError(null);
    setClaimOk(null);
    try {
      if (!demoMode && hasApiBaseUrl()) {
        await apiClaimReward(choice, amount, extras);
        await refreshRewards();
      } else {
        claimReward(choice, amount);
      }
      const label = REWARD_LABELS[choice];
      setClaimOk(
        choice === "cash"
          ? `Cash withdraw requested: ${amount} Tk via ${extras?.paymentMethod ?? "wallet"}. Emon got the email.`
          : `Claimed ${label}. Emon will fulfill it when he can.`,
      );
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Could not claim");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-[2rem] text-ink sm:text-4xl">
          Rewards
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Study points → treats, cash, or an extra date with Emon.
        </p>
      </header>

      <MotivationalBanner dateStr={todayDate} />

      {score.studyStar ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-4 py-2 text-sm font-semibold text-ink">
          <StarIcon /> Study Star today
          {score.fullPlan ? " · Full Plan +100 pts day" : ""} ·{" "}
          {Math.round(score.total)} pts from today&apos;s plan
        </p>
      ) : (
        <p className="text-sm text-ink-muted">
          Finish the Frog (≥50) for a Study Star day. A perfect day banks 100
          points.
        </p>
      )}

      {notes[0] ? (
        <aside className="rounded-2xl border border-lavender-mid/40 bg-lavender-soft/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-lavender-deep">
            Note from Emon
          </p>
          <p className="mt-2 font-display text-lg italic text-ink">
            &ldquo;{notes[0].body}&rdquo;
          </p>
        </aside>
      ) : null}

      <PointsWalletCard
        balance={weekly.wallet.balance}
        earned={weekly.wallet.earned}
        spent={weekly.wallet.spent}
        monthEarned={weekly.monthEarned}
        extraDateCost={weekly.extraDateCost}
        monthProgressPct={weekly.monthProgressPct}
      />

      <WeeklyProgress
        starCount={weekly.starCount}
        starDays={weekly.starDays}
        weekDays={weekDays}
      />

      <RewardPicker
        balance={weekly.wallet.balance}
        dateClaimedThisMonth={weekly.dateClaimedThisMonth}
        onClaim={(choice, amount, extras) =>
          void onClaim(choice, amount, extras)
        }
      />

      {weekly.recentClaims.length > 0 ? (
        <section className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card">
          <h2 className="font-display text-lg text-ink">Recent claims</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {weekly.recentClaims.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-lavender-soft/30 px-3 py-2"
              >
                <span>
                  {REWARD_LABELS[c.choice]}
                  {c.tkAmount ? ` · ${c.tkAmount} Tk` : ""}
                  <span className="text-ink-muted">
                    {" "}
                    (−{c.pointsSpent} pts)
                  </span>
                </span>
                <span className="text-xs font-semibold text-lavender-deep">
                  {c.fulfilled ? "Done" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {claimOk ? (
        <p className="text-sm font-medium text-lavender-deep" role="status">
          {claimOk}
        </p>
      ) : null}
      {claimError ? (
        <p className="text-sm text-red-700" role="alert">
          {claimError}
        </p>
      ) : null}
    </div>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-gold" fill="currentColor" aria-hidden>
      <path d="M10 1.5 12.4 7l5.9.5-4.5 3.8 1.4 5.7L10 14.5 4.8 17l1.4-5.7L1.7 7.5 7.6 7 10 1.5z" />
    </svg>
  );
}
