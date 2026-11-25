"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LavenderSprig } from "@/components/illustrations/Lavender";
import { DayCompleteModal } from "@/components/today/DayCompleteModal";
import { FrogCard } from "@/components/today/FrogCard";
import { HandwrittenPlanCard } from "@/components/today/HandwrittenPlanCard";
import { MotivationalBanner } from "@/components/today/MotivationalBanner";
import { PlanProgress } from "@/components/today/PlanProgress";
import { StudyChecklist } from "@/components/today/StudyChecklist";
import {
  dayCompleteMessage,
  hasSeenDayComplete,
  markDayCompleteSeen,
} from "@/lib/day-complete";
import { dhakaGreeting, formatDhakaLong } from "@/lib/dates";
import { useDiary } from "@/lib/diary-store";
import { sortTasksByStartTime } from "@/lib/task-time";

export function TodayView() {
  const {
    todayDate,
    tomorrowDate,
    todayPlan,
    score,
    setTaskCompleted,
    demoMode,
    tick,
    tomorrowDraft,
  } = useDiary();
  const frog = todayPlan?.tasks.find((t) => t.isFrog) ?? null;
  const others = useMemo(
    () =>
      sortTasksByStartTime(todayPlan?.tasks.filter((t) => !t.isFrog) ?? []),
    [todayPlan?.tasks],
  );
  const [greeting, setGreeting] = useState("Hello");
  const [celebrate, setCelebrate] = useState(false);
  const confirmedTomorrow = tomorrowDraft.confirmedPlan;
  const allDone =
    Boolean(todayPlan?.tasks.length) &&
    todayPlan!.tasks.every((t) => t.completed);

  useEffect(() => {
    setGreeting(dhakaGreeting());
  }, [tick]);

  useEffect(() => {
    if (!allDone) return;
    if (hasSeenDayComplete(todayDate)) return;
    setCelebrate(true);
  }, [allDone, todayDate, todayPlan?.tasks]);

  const msg = dayCompleteMessage(todayDate);

  function closeCelebrate() {
    markDayCompleteSeen(todayDate);
    setCelebrate(false);
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-lavender lg:hidden">
            Arin&apos;s Study Diary
          </p>
          <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink sm:text-4xl">
            {greeting}, Arin
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted" suppressHydrationWarning>
            {formatDhakaLong(todayDate)}
          </p>
        </div>
        <LavenderSprig className="h-14 w-8 shrink-0 opacity-90 lg:hidden" />
      </header>

      <div className="animate-rise-delay">
        <MotivationalBanner dateStr={todayDate} />
      </div>

      {todayPlan ? (
        <p
          className="animate-rise text-xs font-medium text-lavender"
          role="status"
        >
          Showing today&apos;s plan · {todayPlan.tasks.length} tasks
          {confirmedTomorrow
            ? ` · also saved for ${formatDhakaLong(confirmedTomorrow.planDate)}`
            : ""}
        </p>
      ) : (
        <p className="animate-rise rounded-xl border border-lavender-soft bg-card px-4 py-3 text-sm text-ink-muted">
          No plan for today yet.{" "}
          <Link
            href="/tomorrow"
            className="font-semibold text-lavender-deep underline"
          >
            Plan tomorrow
          </Link>{" "}
          ({formatDhakaLong(tomorrowDate)}) — after you confirm, Frog + checklist
          + notebook photo appear here.
        </p>
      )}

      <div className="animate-rise-delay-2 grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="space-y-5">
          <FrogCard task={frog} onSetCompleted={setTaskCompleted} />
          <StudyChecklist tasks={others} onSetCompleted={setTaskCompleted} />
        </div>
        <div className="space-y-5">
          <HandwrittenPlanCard
            photoUrl={todayPlan?.photoUrl}
            demo={demoMode}
          />
          <PlanProgress score={score} />
        </div>
      </div>

      <DayCompleteModal
        open={celebrate}
        title={msg.title}
        body={msg.body}
        onClose={closeCelebrate}
      />
    </div>
  );
}
