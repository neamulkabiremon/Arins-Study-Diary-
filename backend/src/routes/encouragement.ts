import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { requireUser } from "../auth.js";
import { json, parseJsonBody } from "../http.js";
import { notes, users } from "../mongo.js";
import { noteSchema } from "../schema.js";

export async function handleListNotes(event: APIGatewayProxyEventV2) {
  await requireUser(event);
  const col = await notes();
  const rows = await col
    .find({})
    .sort({ createdAt: -1 })
    .limit(40)
    .toArray();

  const userCol = await users();
  const authors = await userCol.find({}).toArray();
  const byId = new Map(
    authors.map((u) => [
      String(u._id),
      {
        role: u.role as "arin" | "emon",
        name: u.displayName || (u.role === "arin" ? "Arin Mahi" : "Emon"),
      },
    ]),
  );

  return json(
    200,
    {
      notes: rows.map((n) => {
        const author = byId.get(n.authorId);
        return {
          id: String(n._id),
          body: n.body,
          createdAt: n.createdAt.toISOString(),
          createdBy: n.authorId,
          authorRole: n.authorRole ?? author?.role ?? null,
          authorName: n.authorName ?? author?.name ?? "Someone",
        };
      }),
    },
    event,
  );
}

export async function handleCreateNote(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const { body } = noteSchema.parse(parseJsonBody(event));
  const col = await notes();
  const authorName =
    user.displayName || (user.role === "arin" ? "Arin Mahi" : "Emon");
  const now = new Date();
  const result = await col.insertOne({
    authorId: user.id,
    authorRole: user.role,
    authorName,
    body,
    createdAt: now,
  });

  // Email the partner a beautiful note notification (async; don't block reply)
  void (async () => {
    try {
      const { arinEmail, emonEmail, sendMail } = await import("../mail/smtp.js");
      const { encouragementNoteEmail } = await import("../mail/templates.js");
      const partnerRole = user.role === "arin" ? "emon" : "arin";
      const to =
        partnerRole === "arin" ? arinEmail() : emonEmail();
      if (!to) return;
      const toName = partnerRole === "arin" ? "Arin" : "Emon";
      const diaryUrl =
        process.env.DIARY_APP_URL?.replace(/\/+$/, "") ||
        "https://arins-study-diary.vercel.app";
      const mail = encouragementNoteEmail({
        fromName: authorName.split(/\s+/)[0] || authorName,
        toName,
        body,
        diaryUrl: `${diaryUrl}/together?tab=notes`,
      });
      await sendMail({ to, ...mail });
    } catch (err) {
      console.error("[mail] encouragement note notify failed", err);
    }
  })();

  return json(
    200,
    {
      note: {
        id: String(result.insertedId),
        body,
        createdAt: now.toISOString(),
        createdBy: user.id,
        authorRole: user.role,
        authorName,
      },
    },
    event,
  );
}
