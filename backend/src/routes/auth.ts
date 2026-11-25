import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { z } from "zod";
import { loginWithPassword, requireUser } from "../auth.js";
import { json, parseJsonBody } from "../http.js";
import { ObjectId, users } from "../mongo.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Profile photo: compressed data URL (keep under ~180KB). */
const avatarSchema = z.object({
  avatarDataUrl: z
    .string()
    .max(250_000)
    .nullable()
    .refine(
      (v) =>
        v === null ||
        v.startsWith("data:image/jpeg") ||
        v.startsWith("data:image/png") ||
        v.startsWith("data:image/webp"),
      "Avatar must be a jpeg/png/webp data URL or null",
    ),
});

export async function handleLogin(event: APIGatewayProxyEventV2) {
  const body = loginSchema.parse(parseJsonBody(event));
  const { token, user } = await loginWithPassword(body.email, body.password);
  return json(200, { token, user }, event);
}

export async function handleMe(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  return json(200, { user }, event);
}

export async function handleUpdateAvatar(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const body = avatarSchema.parse(parseJsonBody(event));
  const col = await users();
  await col.updateOne(
    { _id: new ObjectId(user.id) },
    { $set: { avatarDataUrl: body.avatarDataUrl } },
  );
  return json(
    200,
    {
      ok: true,
      user: {
        ...user,
        avatarDataUrl: body.avatarDataUrl,
      },
    },
    event,
  );
}
