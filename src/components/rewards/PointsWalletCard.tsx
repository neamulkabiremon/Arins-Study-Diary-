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
    <section className="rounded-2xl bg-lavender-soft/45 px-5 py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-lavender-deep">
            Points bank
          </p>
          <p className="mt-1 font-display text-4xl text-lavender-deep">
            {balance}
            <span className="ml-1.5 text-base font-sans font-semibold text-ink-muted">
              pts
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Earned {earned} · spent {spent}
          </p>
        </div>
        <p className="pb-1 text-right text-xs text-ink-muted">
          ≈ {balance} Tk
        </p>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-ink-muted">Toward date</span>
          <span className="text-lavender-deep">
            {monthEarned} / {extraDateCost}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-lavender transition-[width]"
            style={{ width: `${Math.min(100, monthProgressPct)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
