import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { requireRole } from "../auth.js";
import { json } from "../http.js";
import { ObjectId, photoBucket } from "../mongo.js";

/** Returns a short-lived base64 data URL for Arin's own photo (private). */
export async function handleGetPhoto(
  event: APIGatewayProxyEventV2,
  fileId: string,
) {
  const user = await requireRole(event, "arin");
  let _id: ObjectId;
  try {
    _id = new ObjectId(fileId);
  } catch {
    return json(400, { error: "Invalid file id" }, event);
  }

  const bucket = await photoBucket();
  const files = await bucket.find({ _id }).toArray();
  const meta = files[0];
  if (!meta) {
    return json(404, { error: "Photo not found" }, event);
  }
  if (meta.metadata?.ownerId && meta.metadata.ownerId !== user.id) {
    return json(403, { error: "Forbidden" }, event);
  }

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    bucket
      .openDownloadStream(_id)
      .on("data", (c: Buffer) => chunks.push(c))
      .on("error", reject)
      .on("end", () => resolve());
  });

  const buffer = Buffer.concat(chunks);
  const mime =
    (meta.metadata?.mimeType as string | undefined) || "image/jpeg";
  return json(
    200,
    {
      mimeType: mime,
      dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
    },
    event,
  );
}
