import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  extractResponseSchema,
  type ExtractedTaskDraft,
  type ExtractResponse,
} from "../schema.js";

function systemPromptFor(role: "arin" | "emon"): string {
  if (role === "emon") {
    return `You extract an editable daily checklist from a professional's handwritten planner photo (office work, gym, language practice, reading, personal routines).

Rules:
- Return ONLY valid JSON matching the schema. No markdown fences.
- Support English, Bangla, or mixed handwriting.
- Preserve times in titles (e.g. "11:30–5:00 Office work", "7:00–9:00 Gym", "10:00–11:00 Practice French").
- Turn each meaningful timetable block and Top Priority / To Do item into a task.
- Skip pure wake-up / sleep / meal trackers / quotes / water glasses unless they are a real priority task.
- tags: ONLY use "Work", "Gym", "Language", "Reading", "Personal". Never use HSC, Medical, or Engineering.
  Office / infra / work update → Work. Gym → Gym. French/language → Language. Book → Reading. Pack bag / shower / cook / chores → Personal.
- Mark at most one isFrogCandidate (most important block — usually the main office priority).
- Optional firstFiveMinutes when obvious.`;
  }

  return `You extract study tasks from a handwritten notebook photo for an HSC student preparing for medical and engineering admission exams.

Rules:
- Return ONLY valid JSON matching the schema. No markdown fences.
- Support English, Bangla, or mixed handwriting.
- Preserve chapters, question counts, subjects, time blocks.
- tags: ONLY "HSC", "Medical", "Engineering" when they fit (Biology/Chemistry → Medical+HSC; Math/Physics → Engineering+HSC).
- Mark at most one isFrogCandidate. Optional firstFiveMinutes when obvious.
- Skip non-study items.`;
}

function userTextFor(role: "arin" | "emon"): string {
  if (role === "emon") {
    return `Extract this professional daily planner as JSON:
{"tasks":[{"title":"...","tags":["Work"],"isFrogCandidate":false,"firstFiveMinutes":null,"uncertain":false,"confidence":0.0}],"notes":"..."}
Use only Work / Gym / Language / Reading / Personal tags. Do not use HSC, Medical, or Engineering.`;
  }
  return `Extract this study notebook as JSON:
{"tasks":[{"title":"...","tags":["HSC"],"isFrogCandidate":false,"firstFiveMinutes":null,"uncertain":false,"confidence":0.0}],"notes":"..."}
Use only HSC / Medical / Engineering tags.`;
}

function mediaTypeFor(mime: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  if (mime === "image/png") return "image/png";
  if (mime === "image/webp") return "image/webp";
  // HEIC is not accepted by Claude vision — callers should convert; treat as jpeg if somehow passed
  return "image/jpeg";
}

const EMON_TAG_SET = new Set(["Work", "Gym", "Language", "Reading", "Personal"]);
const ARIN_TAG_SET = new Set(["HSC", "Medical", "Engineering"]);

export async function extractTasksFromImage(params: {
  bytes: Buffer;
  mimeType: string;
  role?: "arin" | "emon";
}): Promise<{ result: ExtractResponse; provider: "bedrock"; modelId: string }> {
  const role = params.role ?? "arin";
  const modelId =
    process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-sonnet-4-6";

  const client = new BedrockRuntimeClient({});
  const base64 = params.bytes.toString("base64");

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2048,
    temperature: 0.2,
    system: systemPromptFor(role),
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
          { type: "text", text: userTextFor(role) },
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
  const allowed = role === "emon" ? EMON_TAG_SET : ARIN_TAG_SET;
  result.tasks = result.tasks.map((t) => ({
    ...t,
    tags: t.tags.filter((tag) => allowed.has(tag)),
  }));
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
