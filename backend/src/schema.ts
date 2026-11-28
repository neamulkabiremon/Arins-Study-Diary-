import { z } from "zod";

export const taskTagSchema = z.enum([
  "HSC",
  "Medical",
  "Engineering",
  "Work",
  "Gym",
  "Language",
  "Reading",
  "Personal",
]);

const ALLOWED_TAGS = new Set([
  "HSC",
  "Medical",
  "Engineering",
  "Work",
  "Gym",
  "Language",
  "Reading",
  "Personal",
]);

const looseTags = z
  .array(z.string())
  .optional()
  .default([])
  .transform((tags) =>
    tags.filter((t): t is z.infer<typeof taskTagSchema> => ALLOWED_TAGS.has(t)),
  );

export const extractedTaskSchema = z.object({
  title: z.string().min(1).max(300),
  tags: looseTags,
  isFrogCandidate: z.boolean().optional().default(false),
  firstFiveMinutes: z.string().max(300).nullable().optional(),
  uncertain: z.boolean().optional().default(false),
  confidence: z.number().min(0).max(1).optional().catch(undefined),
});

export const extractResponseSchema = z.object({
  tasks: z.array(extractedTaskSchema).max(40),
  notes: z.string().max(800).optional(),
});

export type ExtractResponse = z.infer<typeof extractResponseSchema>;

export interface ExtractedTaskDraft {
  clientId: string;
  title: string;
  tags: Array<
    | "HSC"
    | "Medical"
    | "Engineering"
    | "Work"
    | "Gym"
    | "Language"
    | "Reading"
    | "Personal"
  >;
  isFrog: boolean;
  firstFiveMinutes?: string | null;
  uncertain: boolean;
  confidence?: number;
}

export const AI_DATA_NOTICE =
  "Sent to Bedrock: notebook photo bytes + extraction instructions only. Not sent: account identity, other days' plans, or reward history.";

export const confirmPlanSchema = z.object({
  planDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  photoPath: z.string().nullable().optional(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        tags: z.array(taskTagSchema),
        isFrog: z.boolean(),
        firstFiveMinutes: z.string().max(200).nullable().optional(),
        uncertain: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(30),
});

export const toggleTaskSchema = z.object({
  completed: z.boolean(),
});

export const claimSchema = z.object({
  choice: z.enum([
    "date_with_emon",
    "date_with_arin",
    "chocolate",
    "outfit",
    "cash",
    "makeup",
    "personal_gift",
  ]),
  /** For cash: points to withdraw (1 point = 1 Tk). */
  amount: z.number().int().positive().optional(),
  /** Preference note (especially for cash / treats). */
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["bkash", "rocket", "nagad", "other"]).optional(),
  paymentNumber: z.string().max(40).optional(),
});

export const fulfillSchema = z.object({
  claimId: z.string().min(1),
});

export const noteSchema = z.object({
  body: z.string().min(1).max(500),
});

export const extractBodySchema = z.object({
  mimeType: z
    .string()
    .optional()
    .transform((v) => {
      const m = (v || "image/jpeg").toLowerCase().trim();
      if (m === "image/jpg" || m === "jpg" || m === "jpeg" || m === "") {
        return "image/jpeg" as const;
      }
      if (m === "image/png" || m === "png") return "image/png" as const;
      if (m === "image/webp" || m === "webp") return "image/webp" as const;
      if (m === "image/heic" || m === "heic") return "image/heic" as const;
      if (m === "image/heif" || m === "heif") return "image/heif" as const;
      // Default: treat unknown image/* as jpeg for Bedrock
      return "image/jpeg" as const;
    }),
  /** Base64-encoded image bytes (no data: URL prefix). Max ~8 MB decoded. */
  data: z.string().min(1),
});

export const uploadBodySchema = extractBodySchema;
