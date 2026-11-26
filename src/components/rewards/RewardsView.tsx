"use client";

import { useState } from "react";
import { PointsWalletCard } from "@/components/rewards/PointsWalletCard";
import {
  RewardPicker,
  type CashClaimExtras,
} from "@/components/rewards/RewardPicker";
import { WeeklyProgress } from "@/components/rewards/WeeklyProgress";
import { PartnerNoteCard } from "@/components/notes/PartnerNoteCard";
import { apiClaimReward, hasApiBaseUrl } from "@/lib/api";
import { REWARD_LABELS } from "@/lib/reward-rules";
import { weekDayStrings } from "@/lib/dates";
import { useDiary } from "@/lib/diary-store";
import { getSessionUser } from "@/lib/session";
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
  const role = getSessionUser()?.role ?? "arin";
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
          ? `Cash withdraw requested: ${amount} Tk.`
          : `Claimed ${label}.`,
      );
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Could not claim");
    }
  }

  const partnerNote = notes.find((n) =>
    n.authorRole
      ? n.authorRole !== role
      : n.createdBy !== (getSessionUser()?.id ?? role),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-display text-[1.85rem] text-ink sm:text-4xl">
          Rewards
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          {role === "emon"
            ? "Bank points → earn a date with Arin."
            : "Bank points → treats, cash, or an extra date."}
        </p>
        {score.hasPlan ? (
          <p className="mt-2 text-xs font-medium text-lavender-deep">
            {score.studyStar
              ? `Study Star today · ${Math.round(score.total)} pts`
              : `Today so far · ${Math.round(score.total)} pts · finish every task for a Star`}
          </p>
        ) : null}
      </header>

      {partnerNote ? (
        <PartnerNoteCard note={partnerNote} myRole={role} compact />
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
        role={role}
        onClaim={(choice, amount, extras) =>
          void onClaim(choice, amount, extras)
        }
      />

      {weekly.recentClaims.length > 0 ? (
        <section>
          <h2 className="mb-2 font-display text-lg text-ink">Recent</h2>
          <ul className="divide-y divide-lavender-soft/80 border-y border-lavender-soft/80 text-sm">
            {weekly.recentClaims.slice(0, 5).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 py-2.5"
              >
                <span>
                  {REWARD_LABELS[c.choice]}
                  {c.tkAmount ? ` · ${c.tkAmount} Tk` : ""}
                  <span className="text-ink-muted"> (−{c.pointsSpent})</span>
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
        <p className="text-sm font-medium text-leaf" role="status">
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
