import { dhakaDateString } from "../dates.js";
import { getDb, plans } from "../mongo.js";
import { quoteForDate } from "./quotes.js";
import {
  dhakaDateTime,
  formatClock,
  parseTaskStartMinutes,
} from "./parse-task-time.js";
import { arinEmail, sendMail } from "./smtp.js";
import { taskReminderEmail } from "./templates.js";

/** Every minute: email Arin 15 minutes before each timed task starts (Dhaka). */
export async function tickTaskReminders(now = new Date()): Promise<{
  checked: number;
  sent: number;
}> {
  const planDate = dhakaDateString(now);
  const col = await plans();
  const dayPlans = await col.find({ planDate, confirmed: true }).toArray();
  if (!dayPlans.length) return { checked: 0, sent: 0 };

  const to = arinEmail();
  if (!to) return { checked: 0, sent: 0 };

  const db = await getDb();
  const log = db.collection("mail_log");
  const quote = quoteForDate(planDate);
  let checked = 0;
  let sent = 0;

  for (const plan of dayPlans) {
    for (const task of plan.tasks ?? []) {
      checked += 1;
      if (task.completed) continue;
      const startMin = parseTaskStartMinutes(task.title);
      if (startMin == null) continue;

      const startAt = dhakaDateTime(planDate, startMin);
      const remindAt = new Date(startAt.getTime() - 15 * 60 * 1000);
      // Fire anytime in the 15-minute window before start
      if (now < remindAt || now >= startAt) continue;

      const key = `reminder:${planDate}:${task.id}`;
      const existing = await log.findOne({ key });
      if (existing) continue;

      const mail = taskReminderEmail({
        taskTitle: task.title,
        startMinutes: startMin,
        firstFive: task.firstFiveMinutes,
        tags: task.tags,
        quote,
      });

      const result = await sendMail({ to, ...mail });
      await log.insertOne({
        key,
        type: "task_reminder",
        planDate,
        taskId: task.id,
        to,
        subject: mail.subject,
        ok: result.ok,
        skipped: result.skipped ?? false,
        error: result.error ?? null,
        createdAt: new Date(),
      });
      if (result.ok) sent += 1;
    }
  }

  return { checked, sent };
}

export function buildReminderSchedule(
  planDate: string,
  tasks: Array<{ title: string }>,
): Array<{ title: string; remindClock: string; startClock: string }> {
  const lines: Array<{
    title: string;
    remindClock: string;
    startClock: string;
  }> = [];
  for (const task of tasks) {
    const startMin = parseTaskStartMinutes(task.title);
    if (startMin == null) continue;
    const remindMin = startMin - 15;
    const remindClock =
      remindMin >= 0
        ? formatClock(remindMin)
        : formatClock(((remindMin % (24 * 60)) + 24 * 60) % (24 * 60));
    lines.push({
      title: task.title,
      remindClock,
      startClock: formatClock(startMin),
    });
  }
  return lines;
}
