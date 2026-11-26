"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DayCompleteModal } from "@/components/today/DayCompleteModal";
import { FrogCard } from "@/components/today/FrogCard";
import { HandwrittenPlanCard } from "@/components/today/HandwrittenPlanCard";
import { MotivationalBanner } from "@/components/today/MotivationalBanner";
import { PlanProgress } from "@/components/today/PlanProgress";
import { StudyChecklist } from "@/components/today/StudyChecklist";
import { PartnerNoteCard } from "@/components/notes/PartnerNoteCard";
import {
  dayCompleteMessage,
  hasSeenDayComplete,
  markDayCompleteSeen,
} from "@/lib/day-complete";
import { dhakaGreeting, formatDhakaLong } from "@/lib/dates";
import { useDiary } from "@/lib/diary-store";
import { getSessionUser } from "@/lib/session";
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
    notes,
  } = useDiary();
  const session = getSessionUser();
  const role = session?.role ?? "arin";
  const firstName =
    session?.displayName?.split(/\s+/)[0] ||
    (role === "emon" ? "Emon" : "Arin");
  const partnerNote = notes.find((n) =>
    n.authorRole
      ? n.authorRole !== role
      : n.createdBy !== (session?.id ?? role),
  );
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
    <div className="space-y-5 sm:space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender lg:hidden">
            Study Diary
          </p>
          <h1 className="mt-1 font-display text-[1.85rem] leading-tight text-ink sm:text-4xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-muted" suppressHydrationWarning>
            {formatDhakaLong(todayDate)}
            {todayPlan
              ? ` · ${todayPlan.tasks.filter((t) => t.completed).length}/${todayPlan.tasks.length} done`
              : ""}
          </p>
        </div>
        {score.hasPlan ? (
          <p className="shrink-0 rounded-full bg-lavender-soft/80 px-3 py-1.5 text-xs font-bold text-lavender-deep">
            {Math.round(score.total)} pts
          </p>
        ) : null}
      </header>

      {partnerNote ? (
        <PartnerNoteCard note={partnerNote} myRole={role} compact />
      ) : null}

      {!todayPlan ? (
        <div className="rounded-2xl bg-lavender-soft/40 px-5 py-8 text-center">
          <p className="font-display text-xl text-lavender-deep">
            No plan for today yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Plan tomorrow ({formatDhakaLong(tomorrowDate)}) — after you confirm,
            your Frog and checklist show up here.
          </p>
          <Link
            href="/tomorrow"
            className="mt-5 inline-flex rounded-2xl bg-lavender px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-lavender-deep"
          >
            Plan tomorrow
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-7">
          <div className="space-y-4">
            <FrogCard task={frog} onSetCompleted={setTaskCompleted} />
            <StudyChecklist tasks={others} onSetCompleted={setTaskCompleted} />
          </div>
          <div className="space-y-4">
            <PlanProgress score={score} />
            <HandwrittenPlanCard
              photoUrl={todayPlan?.photoUrl}
              demo={demoMode}
            />
            {confirmedTomorrow ? (
              <p className="text-xs text-ink-muted">
                Also saved for {formatDhakaLong(confirmedTomorrow.planDate)}.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Quote lives below the study work — quieter hierarchy */}
      <div className="pt-2 opacity-90">
        <MotivationalBanner dateStr={todayDate} />
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
