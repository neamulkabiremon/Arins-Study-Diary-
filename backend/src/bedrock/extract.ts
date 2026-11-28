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

  return `You extract an editable daily checklist from a handwritten notebook / routine photo for Arin (HSC medical + engineering track).

Rules:
- Return ONLY valid JSON. No markdown fences. No extra keys beyond the schema.
- Support English, Bangla, French, or mixed handwriting.
- Read the MAIN notepad / routine page in the foreground. Ignore dense formula sheets or printed pages underneath/behind it.
- Turn each timed routine block into a task. Put times in the title (e.g. "6:30–9:00 Math", "10:00–11:30 Biology").
- Include study blocks (Math, Physics, Chemistry, Biology, Language practice) AND important day blocks (NID paperwork, appointments) when written as timed plan items.
- Skip pure wake-up / "getting ready" / sleep / decorative logos unless they are the only content.
- tags: only "HSC", "Medical", "Engineering", "Language", "Personal" when they fit.
  Biology/Chemistry → Medical+HSC. Math/Physics → Engineering+HSC. Language practise / French → Language (+ HSC ok). Errands/appointments → Personal.
- Mark at most one isFrogCandidate (hardest study block, often Math/Physics before exams).
- Optional firstFiveMinutes when obvious. Keep notes under 400 characters.`;
}

function userTextFor(role: "arin" | "emon"): string {
  if (role === "emon") {
    return `Extract this professional daily planner as JSON:
{"tasks":[{"title":"...","tags":["Work"],"isFrogCandidate":false,"firstFiveMinutes":null,"uncertain":false,"confidence":0.0}],"notes":"..."}
Use only Work / Gym / Language / Reading / Personal tags. Do not use HSC, Medical, or Engineering.`;
  }
  return `Extract the handwritten routine on the main notepad as JSON:
{"tasks":[{"title":"6:30–9:00 Math","tags":["HSC","Engineering"],"isFrogCandidate":true,"firstFiveMinutes":null,"uncertain":false,"confidence":0.0}],"notes":"..."}
Include every timed plan line you can read on the foreground notebook. Ignore background worksheets. Tags only from HSC, Medical, Engineering, Language, Personal.`;
}

function mediaTypeFor(mime: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  if (mime === "image/png") return "image/png";
  if (mime === "image/webp") return "image/webp";
  // HEIC is not accepted by Claude vision — callers should convert; treat as jpeg if somehow passed
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

  // Model sometimes adds extra keys / long notes — sanitize before Zod
  if (parsed && typeof parsed === "object") {
    const obj = parsed as {
      notes?: unknown;
      tasks?: Array<Record<string, unknown>>;
    };
    if (typeof obj.notes === "string" && obj.notes.length > 800) {
      obj.notes = obj.notes.slice(0, 800);
    }
    if (Array.isArray(obj.tasks)) {
      obj.tasks = obj.tasks.map((t) => ({
        title: t.title,
        tags: t.tags,
        isFrogCandidate: t.isFrogCandidate,
        firstFiveMinutes: t.firstFiveMinutes,
        uncertain: t.uncertain,
        confidence: t.confidence,
      }));
    }
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
