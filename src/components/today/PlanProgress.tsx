"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { displayPoints, displayScore } from "@/lib/scoring";
import type { ScoreBreakdown } from "@/lib/types";

export function PlanProgress({ score }: { score: ScoreBreakdown }) {
  const [open, setOpen] = useState(false);

  if (!score.hasPlan) {
    return (
      <section
        aria-labelledby="progress-heading"
        className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card"
      >
        <h2 id="progress-heading" className="font-display text-lg text-ink">
          Plan progress
        </h2>
        <p className="mt-3 text-sm text-ink-muted">
          No plan for today yet — no score until a checklist is confirmed.
        </p>
      </section>
    );
  }

  const shown = displayScore(score.total);

  return (
    <section
      aria-labelledby="progress-heading"
      className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="progress-heading" className="font-display text-lg text-ink">
          Plan progress
        </h2>
        {score.studyStar ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-xs font-semibold text-ink shadow-card">
            <StarIcon /> Study Star earned
          </span>
        ) : null}
      </div>

      <button
        type="button"
        className="mt-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="score-breakdown"
      >
        <p className="font-display text-3xl tracking-tight text-lavender-deep">
          {shown} <span className="text-xl text-ink-muted">/ 100</span>
        </p>
        <p className="mt-1 text-xs font-medium text-lavender underline-offset-2 hover:underline">
          {open ? "Hide breakdown" : "Tap for score breakdown"}
        </p>
      </button>

      <div className="mt-4">
        <ProgressBar value={shown} label="Daily plan score" />
      </div>

      {score.fullPlan ? (
        <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-lavender-soft px-3 py-1.5 text-xs font-semibold text-lavender-deep">
          Full Plan badge
        </p>
      ) : null}

      {open ? (
        <dl
          id="score-breakdown"
          className="mt-4 space-y-2 rounded-2xl bg-ivory-deep/60 p-3.5 text-sm"
        >
          <div className="flex justify-between gap-2">
            <dt>Frog ({displayPoints(score.frogPoints)} pts)</dt>
            <dd className="font-semibold">{displayPoints(score.frogEarned)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>
              Other tasks ({displayPoints(score.otherTaskPoints)} pts each)
            </dt>
            <dd className="font-semibold">
              {displayPoints(score.otherTasksEarned)}
            </dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-lavender-soft pt-2">
            <dt>Completed</dt>
            <dd className="font-semibold">
              {score.completedCount} / {score.totalCount}
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 text-gold"
      fill="currentColor"
      aria-hidden
    >
      <path d="M10 1.5 12.4 7l5.9.5-4.5 3.8 1.4 5.7L10 14.5 4.8 17l1.4-5.7L1.7 7.5 7.6 7 10 1.5z" />
    </svg>
  );
}
