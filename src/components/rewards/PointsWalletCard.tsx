"use client";

import { EXTRA_DATE_COST } from "@/lib/reward-rules";

export function PointsWalletCard({
  balance,
  earned,
  spent,
  monthEarned,
  extraDateCost = EXTRA_DATE_COST,
  monthProgressPct,
}: {
  balance: number;
  earned: number;
  spent: number;
  monthEarned: number;
  extraDateCost?: number;
  monthProgressPct: number;
}) {
  return (
    <section className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card">
      <h2 className="font-display text-lg text-ink">Study points bank</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Each day up to 100 points. Spend on treats, cash (1 pt = 1 Tk), or save
        for an extra date.
      </p>

      <p className="mt-4 font-display text-4xl text-lavender-deep">
        {balance}
        <span className="ml-2 text-base font-sans font-semibold text-ink-muted">
          pts
        </span>
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Earned {earned} · Spent {spent} · Cash value ≈ {balance} Tk
      </p>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-ink-muted">Toward extra date this month</span>
          <span className="text-lavender-deep">
            {monthEarned} / {extraDateCost}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-lavender-soft">
          <div
            className="h-full rounded-full bg-lavender transition-[width]"
            style={{ width: `${Math.min(100, monthProgressPct)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Regular dates with Emon stay free — this is an <em>extra</em> date
          earned by studying ({extraDateCost} pts ≈ a strong full month).
        </p>
      </div>
    </section>
  );
}
