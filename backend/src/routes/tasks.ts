import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { requireUser } from "../auth.js";
import { json, parseJsonBody } from "../http.js";
import { awards, plans } from "../mongo.js";
import { computeScore } from "../scoring.js";
import { toggleTaskSchema } from "../schema.js";

export async function handleToggleTask(
  event: APIGatewayProxyEventV2,
  taskId: string,
) {
  const user = await requireUser(event);
  const parsed = toggleTaskSchema.parse(parseJsonBody(event));
  const col = await plans();

  // Prefer today's plan when the same task id could theoretically appear
  // in more than one day (defensive); still match by task id.
  const { dhakaDateString } = await import("../dates.js");
  const today = dhakaDateString();
  let plan = await col.findOne({
    ownerId: user.id,
    planDate: today,
    "tasks.id": taskId,
  });
  if (!plan) {
    plan = await col.findOne({
      ownerId: user.id,
      "tasks.id": taskId,
    });
  }
  if (!plan) {
    return json(404, { error: "Task not found" }, event);
  }

  const tasks = plan.tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          completed: parsed.completed,
          completedAt: parsed.completed ? new Date() : null,
        }
      : t,
  );

  await col.updateOne(
    { _id: plan._id },
    { $set: { tasks, updatedAt: new Date() } },
  );

  // Recompute day score from ALL tasks — check raises pts, uncheck lowers pts
  const score = computeScore(tasks);
  const dayScore = Math.round(score.total * 100) / 100;
  const awardCol = await awards();
  await awardCol.updateOne(
    { ownerId: user.id, awardDate: plan.planDate },
    {
      $set: {
        ownerId: user.id,
        awardDate: plan.planDate,
        score: dayScore,
        studyStar: score.studyStar,
        fullPlan: score.fullPlan,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  const { getWallet } = await import("../wallet.js");
  const wallet = await getWallet(user.id);

  return json(
    200,
    {
      ok: true,
      planDate: plan.planDate,
      completed: parsed.completed,
      score: { ...score, total: dayScore },
      wallet,
    },
    event,
  );
}
