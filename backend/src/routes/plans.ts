import { randomUUID } from "crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { requireUser } from "../auth.js";
import { dhakaTomorrowString } from "../dates.js";
import { json, parseJsonBody } from "../http.js";
import { plans } from "../mongo.js";
import { confirmPlanSchema } from "../schema.js";
import type { StudyTaskDoc } from "../types.js";

export async function handleConfirmPlan(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const parsed = confirmPlanSchema.parse(parseJsonBody(event));
  const planDate = parsed.planDate ?? dhakaTomorrowString();

  let taskInputs = parsed.tasks.map((t, i) => ({ ...t, sort: i }));
  if (!taskInputs.some((t) => t.isFrog)) {
    taskInputs = taskInputs.map((t, i) => ({ ...t, isFrog: i === 0 }));
  } else {
    let seen = false;
    taskInputs = taskInputs.map((t) => {
      if (!t.isFrog) return t;
      if (seen) return { ...t, isFrog: false };
      seen = true;
      return t;
    });
  }

  const { parseTaskStartMinutes } = await import("../mail/parse-task-time.js");
  const sortedInputs = [...taskInputs].sort((a, b) => {
    const am = parseTaskStartMinutes(a.title);
    const bm = parseTaskStartMinutes(b.title);
    if (am == null && bm == null) return a.sort - b.sort;
    if (am == null) return 1;
    if (bm == null) return -1;
    return am - bm;
  });

  const col = await plans();

  // Preserve completed flags when re-confirming the same day's plan (same titles)
  const existing = await col.findOne({ ownerId: user.id, planDate });
  const prevByTitle = new Map(
    (existing?.tasks ?? []).map((t) => [t.title.trim().toLowerCase(), t]),
  );

  const tasks: StudyTaskDoc[] = sortedInputs.map((t, i) => {
    const prev = prevByTitle.get(t.title.trim().toLowerCase());
    return {
      id: prev?.id ?? randomUUID(),
      title: t.title,
      tags: t.tags,
      isFrog: t.isFrog,
      firstFiveMinutes: t.firstFiveMinutes ?? null,
      completed: prev?.completed ?? false,
      completedAt: prev?.completedAt ?? null,
      uncertain: t.uncertain ?? false,
      sortOrder: i,
    };
  });

  const now = new Date();
  // Keep the GridFS photo from /upload when confirm omits photoPath
  const nextPhotoId =
    parsed.photoPath !== undefined && parsed.photoPath !== null
      ? parsed.photoPath
      : (existing?.photoFileId ?? null);
  await col.updateOne(
    { ownerId: user.id, planDate },
    {
      $set: {
        ownerId: user.id,
        planDate,
        photoFileId: nextPhotoId,
        confirmed: true,
        tasks,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  const saved = await col.findOne({ ownerId: user.id, planDate });

  // Emails: Emon summary + Arin "nudges armed" only for the real tomorrow plan
  // (Today mirror confirm during testing should not double-mail.)
  void (async () => {
    try {
      const { dhakaTomorrowString } = await import("../dates.js");
      const isTomorrowPlan = planDate === dhakaTomorrowString();
      if (!isTomorrowPlan) return;

      const { arinEmail, emonEmail, sendMail } = await import("../mail/smtp.js");
      const { planConfirmedEmail, planArmedEmail } = await import(
        "../mail/templates.js"
      );
      const { quoteForDate } = await import("../mail/quotes.js");
      const { buildReminderSchedule } = await import("../mail/reminders.js");

      const taskPayload = tasks.map((t) => ({
        title: t.title,
        tags: t.tags,
        isFrog: t.isFrog,
        firstFiveMinutes: t.firstFiveMinutes,
      }));

      // Notify the partner; arm reminders for the planner
      if (user.role === "arin") {
        const emonTo = emonEmail();
        if (emonTo) {
          const mail = planConfirmedEmail({ planDate, tasks: taskPayload });
          await sendMail({ to: emonTo, ...mail });
        }
        const arinTo = arinEmail();
        if (arinTo) {
          const quote = quoteForDate(planDate);
          const reminderLines = buildReminderSchedule(planDate, tasks);
          const mail = planArmedEmail({
            planDate,
            tasks: taskPayload,
            reminderLines,
            quote,
          });
          await sendMail({ to: arinTo, ...mail });
        }
      } else {
        const arinTo = arinEmail();
        if (arinTo) {
          const mail = planConfirmedEmail({ planDate, tasks: taskPayload });
          await sendMail({ to: arinTo, ...mail });
        }
        const emonTo = emonEmail();
        if (emonTo) {
          const quote = quoteForDate(planDate);
          const reminderLines = buildReminderSchedule(planDate, tasks);
          const mail = planArmedEmail({
            planDate,
            tasks: taskPayload,
            reminderLines,
            quote,
          });
          await sendMail({ to: emonTo, ...mail });
        }
      }
    } catch (err) {
      console.error("[mail] plan confirm notify failed", err);
    }
  })();

  return json(
    200,
    { planId: String(saved?._id), planDate },
    event,
  );
}

export async function handleGetToday(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const { dhakaDateString } = await import("../dates.js");
  const planDate = dhakaDateString();
  const col = await plans();
  const plan = await col.findOne({ ownerId: user.id, planDate, confirmed: true });
  return json(200, { plan: plan ? serializePlan(plan) : null, planDate }, event);
}

export async function handleGetTomorrow(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const planDate = dhakaTomorrowString();
  const col = await plans();
  // Return draft or confirmed — photo + tasks survive refresh
  const plan = await col.findOne({ ownerId: user.id, planDate });
  return json(200, { plan: plan ? serializePlan(plan) : null, planDate }, event);
}


function serializePlan(plan: {
  _id?: { toString(): string };
  ownerId: string;
  planDate: string;
  photoFileId?: string | null;
  confirmed: boolean;
  tasks: StudyTaskDoc[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: String(plan._id),
    ownerId: plan.ownerId,
    planDate: plan.planDate,
    photoPath: plan.photoFileId ?? null,
    confirmed: Boolean(plan.confirmed),
    tasks: (plan.tasks ?? []).map((t) => ({
      ...t,
      completedAt: t.completedAt
        ? t.completedAt instanceof Date
          ? t.completedAt.toISOString()
          : t.completedAt
        : null,
    })),
    createdAt:
      plan.createdAt instanceof Date
        ? plan.createdAt.toISOString()
        : String(plan.createdAt),
    updatedAt:
      plan.updatedAt instanceof Date
        ? plan.updatedAt.toISOString()
        : String(plan.updatedAt),
  };
}
