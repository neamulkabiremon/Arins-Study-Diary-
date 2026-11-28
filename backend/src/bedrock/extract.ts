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
- Return ONLY valid JSON matching the schema. No markdown fences. No extra keys.
- Support English, Bangla, or mixed handwriting.
- Preserve times in titles (e.g. "11:30–5:00 Office work", "7:00–9:00 Gym").
- Turn each meaningful timetable block into a task.
- Skip pure wake-up / sleep / meal trackers unless they are a real priority task.
- tags ONLY: "Work", "Gym", "Language", "Reading", "Personal".
- Mark at most one isFrogCandidate.
- Keep notes under 400 characters.`;
  }

  return `You extract an editable daily checklist from a handwritten notebook / "Routine" photo for Arin.

Rules:
- Return ONLY valid JSON. No markdown fences. No extra keys.
- Support English, Bangla, French, or mixed handwriting.
- Focus on the main notepad page. Ignore logos (e.g. Ximeclav) and crossed-out headers.
- Create ONE task per timed line. Put the time range in the title.
  Examples: "10:00–1:00 NID Paper Work", "6:30–9:00 Math", "10:00–11:30 Biology".
- Include study AND day blocks (NID, beauty parlor, French conversation, math, language, biology).
- You may skip only: Wake up, Getting Ready, sleep. Prefer extracting too many over too few.
- NEVER return {"tasks":[]} if any timed activity is readable.
- tags only: "HSC", "Medical", "Engineering", "Language", "Personal"
  Biology/Chemistry → Medical+HSC. Math/Physics → Engineering+HSC. Language/French → Language. Errands → Personal.
- Mark at most one isFrogCandidate (hardest study block).
- Keep notes under 400 characters.`;
}

function userTextFor(role: "arin" | "emon", aggressive: boolean): string {
  if (role === "emon") {
    return aggressive
      ? `Extract EVERY readable timed block as JSON tasks (not an empty list):
{"tasks":[{"title":"11:30–5:00 Office work","tags":["Work"],"isFrogCandidate":true,"firstFiveMinutes":null,"uncertain":false,"confidence":0.9}],"notes":"..."}
Tags only Work/Gym/Language/Reading/Personal.`
      : `Extract this professional daily planner as JSON:
{"tasks":[{"title":"...","tags":["Work"],"isFrogCandidate":false,"firstFiveMinutes":null,"uncertain":false,"confidence":0.0}],"notes":"..."}
Use only Work / Gym / Language / Reading / Personal tags.`;
  }
  return aggressive
    ? `This is a handwritten Routine page. Extract EVERY timed line you can read (NID, Beauty Parlor, French line, Math, Language Practise, Biology, etc). Do NOT return an empty tasks array.
{"tasks":[{"title":"6:30–9:00 Math","tags":["HSC","Engineering"],"isFrogCandidate":true,"firstFiveMinutes":null,"uncertain":false,"confidence":0.95}],"notes":"short"}
Tags only: HSC, Medical, Engineering, Language, Personal.`
    : `Extract the handwritten Routine on the notepad as JSON:
{"tasks":[{"title":"6:30–9:00 Math","tags":["HSC","Engineering"],"isFrogCandidate":true,"firstFiveMinutes":null,"uncertain":false,"confidence":0.0}],"notes":"..."}
Include every timed plan line. Ignore logos and crossed-out headers. Tags: HSC, Medical, Engineering, Language, Personal.`;
}

function mediaTypeFor(mime: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  const m = (mime || "").toLowerCase();
  if (m === "image/png") return "image/png";
  if (m === "image/webp") return "image/webp";
  if (m === "image/gif") return "image/gif";
  return "image/jpeg";
}

const EMON_TAG_SET = new Set(["Work", "Gym", "Language", "Reading", "Personal"]);
const ARIN_TAG_SET = new Set([
  "HSC",
  "Medical",
  "Engineering",
  "Language",
  "Personal",
]);

function sanitizeModelJson(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== "object") return parsed;
  const obj = parsed as {
    notes?: unknown;
    tasks?: Array<Record<string, unknown>>;
  };
  if (typeof obj.notes === "string" && obj.notes.length > 800) {
    obj.notes = obj.notes.slice(0, 800);
  }
  if (Array.isArray(obj.tasks)) {
    obj.tasks = obj.tasks
      .filter((t) => typeof t?.title === "string" && t.title.trim().length > 0)
      .map((t) => ({
        title: String(t.title).trim().slice(0, 300),
        tags: Array.isArray(t.tags) ? t.tags : [],
        isFrogCandidate: Boolean(t.isFrogCandidate),
        firstFiveMinutes:
          t.firstFiveMinutes == null ? null : String(t.firstFiveMinutes).slice(0, 300),
        uncertain: Boolean(t.uncertain),
        confidence:
          typeof t.confidence === "number" ? t.confidence : undefined,
      }));
  }
  return obj;
}

async function invokeOnce(params: {
  bytes: Buffer;
  mimeType: string;
  role: "arin" | "emon";
  modelId: string;
  aggressive: boolean;
}): Promise<ExtractResponse> {
  const client = new BedrockRuntimeClient({});
  const base64 = params.bytes.toString("base64");
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2048,
    temperature: params.aggressive ? 0.05 : 0.15,
    system: systemPromptFor(params.role),
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
          { type: "text", text: userTextFor(params.role, params.aggressive) },
        ],
      },
    ],
  };

  const response = await client.send(
    new InvokeModelCommand({
      modelId: params.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    }),
  );
  const raw = new TextDecoder().decode(response.body);
  let parsedOuter: { content?: Array<{ type?: string; text?: string }> };
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
    // Sometimes model wraps JSON in prose — pull first {...}
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    } else {
      throw new Error("Vision model did not return valid JSON");
    }
  }

  const result = extractResponseSchema.parse(sanitizeModelJson(parsed));
  const allowed = params.role === "emon" ? EMON_TAG_SET : ARIN_TAG_SET;
  result.tasks = result.tasks.map((t) => ({
    ...t,
    tags: t.tags.filter((tag) => allowed.has(tag)),
  }));
  return result;
}

export async function extractTasksFromImage(params: {
  bytes: Buffer;
  mimeType: string;
  role?: "arin" | "emon";
}): Promise<{ result: ExtractResponse; provider: "bedrock"; modelId: string }> {
  const role = params.role ?? "arin";
  const modelId =
    process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-sonnet-4-6";

  let result = await invokeOnce({
    ...params,
    role,
    modelId,
    aggressive: false,
  });

  if (result.tasks.length === 0) {
    console.warn("[extract] empty tasks — retrying with aggressive prompt");
    result = await invokeOnce({
      ...params,
      role,
      modelId,
      aggressive: true,
    });
  }

  console.info("[extract] ok", {
    role,
    modelId,
    taskCount: result.tasks.length,
    bytes: params.bytes.length,
  });

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
