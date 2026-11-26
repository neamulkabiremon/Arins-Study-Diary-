import { computeScore, displayScore } from "../src/lib/scoring";
import type { StudyTask } from "../src/lib/types";

function task(
  partial: Partial<StudyTask> & Pick<StudyTask, "id" | "title" | "isFrog" | "completed">,
): StudyTask {
  return {
    tags: ["HSC"],
    uncertain: false,
    sortOrder: 0,
    firstFiveMinutes: null,
    ...partial,
  };
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Single frog task → 100 when complete → Study Star
{
  const s = computeScore([
    task({ id: "1", title: "Only frog", isFrog: true, completed: true }),
  ]);
  assert(s.total === 100 && s.frogPoints === 100, "single frog = 100");
  assert(s.studyStar && s.fullPlan, "full day = star");
  assert(displayScore(s.total) === 100, "display 100");
}

// Frog + 2 others: frog 50, each other 25 — partial is NOT a star (challenge)
{
  const s = computeScore([
    task({ id: "1", title: "Frog", isFrog: true, completed: true }),
    task({ id: "2", title: "A", isFrog: false, completed: true }),
    task({ id: "3", title: "B", isFrog: false, completed: false }),
  ]);
  assert(s.total === 75, `expected 75 got ${s.total}`);
  assert(!s.studyStar && !s.fullPlan, "no star until all done");
  assert(displayScore(s.total) === 75, "display 75");
}

// All done → star
{
  const s = computeScore([
    task({ id: "1", title: "Frog", isFrog: true, completed: true }),
    task({ id: "2", title: "A", isFrog: false, completed: true }),
    task({ id: "3", title: "B", isFrog: false, completed: true }),
  ]);
  assert(s.total === 100 && s.studyStar && s.fullPlan, "perfect day");
}

// Empty plan
{
  const s = computeScore([]);
  assert(!s.hasPlan && s.total === 0, "empty has no plan score");
}

console.log("scoring checks passed");
