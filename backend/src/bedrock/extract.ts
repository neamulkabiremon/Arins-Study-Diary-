import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  extractResponseSchema,
  type ExtractedTaskDraft,
  type ExtractResponse,
} from "../schema.js";

const SYSTEM_PROMPT = `You extract an editable daily checklist from a handwritten notebook / planner photo.

Works for:
- HSC / medical / engineering study plans
- Work days, gym, language practice, reading, chores, routines

Rules:
- Return ONLY valid JSON matching the schema. No markdown fences.
- Support English, Bangla, or mixed handwriting.
- Preserve times and concrete details in the title (e.g. "11:30–5:00 Office work", "7:00–9:00 Gym", "10:00–11:00 Practice French").
- If the page is a daily timetable / routine, turn each meaningful block into one task. Include work, gym, study, language, reading.
- Skip pure wake-up / sleep / generic "meals" lines unless they are a real timed block the person wrote as a priority.
- Prefer Top Priorities / numbered goals when present.
- Crossed-out titles are not tasks unless rewritten elsewhere.
- If text is unclear, set uncertain=true and keep your best guess in title (do not invent whole tasks).
- tags: ONLY use values from this set when they clearly fit: "HSC", "Medical", "Engineering". Otherwise use [].
- Mark at most one task as isFrogCandidate (hardest / most important block of the day).
- Optional firstFiveMinutes: a tiny practical first step when obvious.
- Ignore decorative quotes and water/checkbox trackers unless they are real tasks.`;

const USER_TEXT = `Read this notebook photo and extract an editable checklist as JSON:
{"tasks":[{"title":"...","tags":[],"isFrogCandidate":false,"firstFiveMinutes":null,"uncertain":false,"confidence":0.0}],"notes":"..."}
Include every distinct timed block and priority you can read (work, study, gym, language, reading, etc.).`;
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
    process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-sonnet-4-6";

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
