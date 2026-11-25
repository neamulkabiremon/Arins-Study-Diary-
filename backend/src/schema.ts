import { z } from "zod";

export const taskTagSchema = z.enum(["HSC", "Medical", "Engineering"]);

export const extractedTaskSchema = z.object({
  title: z.string().min(1).max(200),
  tags: z.array(taskTagSchema).default([]),
  isFrogCandidate: z.boolean().default(false),
  firstFiveMinutes: z.string().max(200).nullable().optional(),
  uncertain: z.boolean().default(false),
  confidence: z.number().min(0).max(1).optional(),
});

export const extractResponseSchema = z.object({
  tasks: z.array(extractedTaskSchema).max(30),
  notes: z.string().max(500).optional(),
});

export type ExtractResponse = z.infer<typeof extractResponseSchema>;

export interface ExtractedTaskDraft {
  clientId: string;
  title: string;
  tags: Array<"HSC" | "Medical" | "Engineering">;
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
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]),
  /** Base64-encoded image bytes (no data: URL prefix). Max ~8 MB decoded. */
  data: z.string().min(1),
});

export const uploadBodySchema = extractBodySchema;
