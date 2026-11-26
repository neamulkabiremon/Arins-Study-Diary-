import type { DailyPlan, ScoreBreakdown, StudyTask } from "./types";

/**
 * Frog is worth 50 when other tasks exist; 100 when it is the only task.
 * Remaining 50 points split evenly across non-frog tasks.
 * Round only for display — store precise totals for eligibility.
 */
export function computeScore(tasks: StudyTask[]): ScoreBreakdown {
  const totalCount = tasks.length;
  if (totalCount === 0) {
    return {
      total: 0,
      frogPoints: 0,
      frogEarned: 0,
      otherTaskPoints: 0,
      otherTasksEarned: 0,
      completedCount: 0,
      totalCount: 0,
      studyStar: false,
      fullPlan: false,
      hasPlan: false,
    };
  }

  const frog = tasks.find((t) => t.isFrog);
  const others = tasks.filter((t) => !t.isFrog);
  const completedCount = tasks.filter((t) => t.completed).length;

  const frogIsOnly = Boolean(frog) && others.length === 0;
  const frogPoints = frog ? (frogIsOnly ? 100 : 50) : 0;
  const otherPool = frog ? (frogIsOnly ? 0 : 50) : 100;
  const otherTaskPoints = others.length > 0 ? otherPool / others.length : 0;

  const frogEarned = frog?.completed ? frogPoints : 0;
  const otherTasksEarned = others
    .filter((t) => t.completed)
    .reduce((sum) => sum + otherTaskPoints, 0);

  const total = frogEarned + otherTasksEarned;
  // Challenge mode: Study Star only when the full day is done (not half).
  const fullPlan = completedCount === totalCount && totalCount > 0;
  const studyStar = fullPlan;

  return {
    total,
    frogPoints,
    frogEarned,
    otherTaskPoints,
    otherTasksEarned,
    completedCount,
    totalCount,
    studyStar,
    fullPlan,
    hasPlan: true,
  };
}

export function scoreFromPlan(plan: DailyPlan | null): ScoreBreakdown {
  if (!plan || !plan.confirmed) {
    return {
      total: 0,
      frogPoints: 0,
      frogEarned: 0,
      otherTaskPoints: 0,
      otherTasksEarned: 0,
      completedCount: 0,
      totalCount: 0,
      studyStar: false,
      fullPlan: false,
      hasPlan: false,
    };
  }
  return computeScore(plan.tasks);
}

/** Display-rounded score out of 100. */
export function displayScore(total: number): number {
  return Math.round(total);
}

export function displayPoints(points: number): string {
  const rounded = Math.round(points * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
