import type { StudyTaskDoc } from "./types.js";

export function computeScore(tasks: StudyTaskDoc[]) {
  const totalCount = tasks.length;
  if (totalCount === 0) {
    return { total: 0, studyStar: false, fullPlan: false };
  }
  const frog = tasks.find((t) => t.isFrog);
  const others = tasks.filter((t) => !t.isFrog);
  const frogIsOnly = Boolean(frog) && others.length === 0;
  const frogPoints = frog ? (frogIsOnly ? 100 : 50) : 0;
  const otherPool = frog ? (frogIsOnly ? 0 : 50) : 100;
  const otherTaskPoints = others.length > 0 ? otherPool / others.length : 0;
  const frogEarned = frog?.completed ? frogPoints : 0;
  const otherTasksEarned =
    others.filter((t) => t.completed).length * otherTaskPoints;
  const total = frogEarned + otherTasksEarned;
  const completedCount = tasks.filter((t) => t.completed).length;
  // Challenge: Study Star only when every task is done
  const fullPlan = completedCount === totalCount;
  return {
    total,
    studyStar: fullPlan,
    fullPlan,
  };
}
