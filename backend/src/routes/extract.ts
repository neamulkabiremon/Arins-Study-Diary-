import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { requireUser } from "../auth.js";
import { extractTasksFromImage, toDraftTasks } from "../bedrock/extract.js";
import { json, parseJsonBody } from "../http.js";
import { AI_DATA_NOTICE, extractBodySchema } from "../schema.js";

const MAX_BYTES = 8 * 1024 * 1024;

export async function handleExtract(event: APIGatewayProxyEventV2) {
  await requireUser(event);

  const body = extractBodySchema.parse(parseJsonBody(event));
  const bytes = Buffer.from(body.data, "base64");
  if (bytes.length > MAX_BYTES) {
    return json(400, { error: "File too large (max 8 MB).", notice: AI_DATA_NOTICE }, event);
  }
  if (
    body.mimeType === "image/heic" ||
    body.mimeType === "image/heif"
  ) {
    return json(
      400,
      {
        error:
          "HEIC is not supported by Bedrock vision. Please convert to JPG or PNG, or use manual entry.",
        notice: AI_DATA_NOTICE,
      },
      event,
    );
  }

  try {
    const { result, provider, modelId } = await extractTasksFromImage({
      bytes,
      mimeType: body.mimeType,
    });
    return json(
      200,
      {
        tasks: toDraftTasks(result),
        notes: result.notes,
        provider,
        modelId,
        notice: AI_DATA_NOTICE,
      },
      event,
    );
  } catch {
    return json(
      500,
      {
        error: "Extraction failed. You can enter tasks manually.",
        notice: AI_DATA_NOTICE,
      },
      event,
    );
  }
}
