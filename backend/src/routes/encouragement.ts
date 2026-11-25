import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { requireRole, requireUser } from "../auth.js";
import { json, parseJsonBody } from "../http.js";
import { notes } from "../mongo.js";
import { noteSchema } from "../schema.js";

export async function handleListNotes(event: APIGatewayProxyEventV2) {
  await requireUser(event);
  const col = await notes();
  const rows = await col
    .find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return json(
    200,
    {
      notes: rows.map((n) => ({
        id: String(n._id),
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        createdBy: n.authorId,
      })),
    },
    event,
  );
}

export async function handleCreateNote(event: APIGatewayProxyEventV2) {
  const user = await requireRole(event, "emon");
  const { body } = noteSchema.parse(parseJsonBody(event));
  const col = await notes();
  const result = await col.insertOne({
    authorId: user.id,
    body,
    createdAt: new Date(),
  });

  return json(
    200,
    {
      note: {
        id: String(result.insertedId),
        body,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      },
    },
    event,
  );
}
