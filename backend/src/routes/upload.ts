import { Readable } from "stream";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { z } from "zod";
import { requireUser } from "../auth.js";
import { dhakaTomorrowString } from "../dates.js";
import { json, parseJsonBody } from "../http.js";
import { photoBucket, plans } from "../mongo.js";
import { uploadBodySchema } from "../schema.js";

const MAX_BYTES = 8 * 1024 * 1024;

const bodySchema = uploadBodySchema.extend({
  /** YYYY-MM-DD Asia/Dhaka — defaults to tomorrow (Plan tomorrow flow). */
  planDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

/**
 * Stores notebook photos in MongoDB GridFS (no S3 required for this private app).
 * Path shape: notebooks/{planDate}/{ownerId}/{timestamp}.{ext}
 */
export async function handleUpload(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const body = bodySchema.parse(parseJsonBody(event));
  const bytes = Buffer.from(body.data, "base64");
  if (bytes.length > MAX_BYTES) {
    return json(400, { error: "File too large (max 8 MB)" }, event);
  }

  const planDate = body.planDate ?? dhakaTomorrowString();
  const ext = extFor(body.mimeType);
  const filename = `notebooks/${planDate}/${user.id}/${Date.now()}.${ext}`;

  const bucket = await photoBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: {
      ownerId: user.id,
      planDate,
      mimeType: body.mimeType,
      contentType: body.mimeType,
      folder: `notebooks/${planDate}`,
    },
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(bytes)
      .pipe(uploadStream)
      .on("finish", () => resolve())
      .on("error", reject);
  });

  const fileId = String(uploadStream.id);

  // Link photo to that day's plan doc so refresh can reload it (draft or confirmed).
  // Also attach to Dhaka "today" when uploading for tomorrow — Plan mirrors onto Today.
  const col = await plans();
  const now = new Date();
  const { dhakaDateString } = await import("../dates.js");
  const today = dhakaDateString();
  const dates = Array.from(new Set([planDate, today]));
  for (const d of dates) {
    await col.updateOne(
      { ownerId: user.id, planDate: d },
      {
        $set: {
          ownerId: user.id,
          planDate: d,
          photoFileId: fileId,
          updatedAt: now,
        },
        $setOnInsert: {
          confirmed: false,
          tasks: [],
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  return json(
    200,
    {
      path: fileId,
      fileId,
      planDate,
      folder: `notebooks/${planDate}`,
      filename,
      // Client should call GET /photos/:id for a durable preview (blob URLs die on refresh)
      signedUrl: null,
    },
    event,
  );
}
