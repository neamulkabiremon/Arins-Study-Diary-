import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  extractResponseSchema,
  type ExtractedTaskDraft,
  type ExtractResponse,
} from "../schema.js";

const SYSTEM_PROMPT = `You extract study tasks from a handwritten notebook photo for a Bangladeshi HSC student preparing for medical and engineering admission exams.

Rules:
- Return ONLY valid JSON matching the schema. No markdown fences.
- Support English, Bangla, or mixed handwriting.
- Preserve concrete details: chapter numbers, question counts, subject names, time blocks.
- If the page is a daily routine / timetable, turn each study block into one task (e.g. "Biology 9:30–11:30"). Skip wake-up / sleep / meals.
- Crossed-out titles are not tasks unless rewritten elsewhere.
- If text is unclear, set uncertain=true and keep your best guess in title (do not invent whole tasks).
- Suggest tags from: HSC, Medical, Engineering (multiple allowed). Biology/Chemistry → often Medical+HSC; Math/Physics → often Engineering+HSC.
- Mark at most one task as isFrogCandidate (the hardest / most important study block).
- Optional firstFiveMinutes: a tiny practical first step when obvious.
- Do not include rewards, personal notes, or non-study items.`;

const USER_TEXT = `Read this notebook photo and extract an editable study checklist as JSON:
{"tasks":[{"title":"...","tags":["HSC"],"isFrogCandidate":false,"firstFiveMinutes":null,"uncertain":false,"confidence":0.0}],"notes":"..."}
Include every distinct study subject/block you can read.`;
function mediaTypeFor(mime: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  if (mime === "image/png") return "image/png";
  if (mime === "image/webp") return "image/webp";
  // HEIC is not accepted by Claude vision — callers should convert; treat as jpeg if somehow passed
  return "image/jpeg";
}

export async function extractTasksFromImage(params: {
  bytes: Buffer;
  mimeType: string;
}): Promise<{ result: ExtractResponse; provider: "bedrock"; modelId: string }> {
  const modelId =
    process.env.BEDROCK_MODEL_ID ??
    "us.anthropic.claude-sonnet-4-5-20250929-v1:0";

  const client = new BedrockRuntimeClient({});
  const base64 = params.bytes.toString("base64");

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2048,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaTypeFor(params.mimeType),
              data: base64,
            },
          },
          { type: "text", text: USER_TEXT },
        ],
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await client.send(command);
  const raw = new TextDecoder().decode(response.body);
  let parsedOuter: {
    content?: Array<{ type?: string; text?: string }>;
  };
  try {
    parsedOuter = JSON.parse(raw) as typeof parsedOuter;
  } catch {
    throw new Error("Bedrock response was not valid JSON");
  }

  const text = parsedOuter.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Empty Bedrock vision response");

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Vision model did not return valid JSON");
  }

  const result = extractResponseSchema.parse(parsed);
  return { result, provider: "bedrock", modelId };
}

export function toDraftTasks(result: ExtractResponse): ExtractedTaskDraft[] {
  const stamp = Date.now();
  let frogAssigned = false;
  return result.tasks.map((t, i) => {
    const wantFrog = Boolean(t.isFrogCandidate) && !frogAssigned;
    if (wantFrog) frogAssigned = true;
    return {
      clientId: `ai-${stamp}-${i}`,
      title: t.title.trim(),
      tags: t.tags,
      isFrog: wantFrog,
      firstFiveMinutes: t.firstFiveMinutes ?? null,
      uncertain:
        t.uncertain ||
        (t.confidence !== undefined && t.confidence < 0.55),
      confidence: t.confidence,
    };
  });
}
