import { z } from "zod";

export const taskTagSchema = z.enum(["HSC", "Medical", "Engineering"]);

export const extractedTaskSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .describe("Concrete task text preserving chapters and question counts"),
  tags: z.array(taskTagSchema).default([]),
  isFrogCandidate: z
    .boolean()
    .default(false)
    .describe("True if this looks like the hardest / priority task"),
  firstFiveMinutes: z
    .string()
    .max(200)
    .nullable()
    .optional()
    .describe("Optional tiny first step"),
  uncertain: z
    .boolean()
    .default(false)
    .describe("True when handwriting was unclear"),
  confidence: z.number().min(0).max(1).optional(),
});

export const extractResponseSchema = z.object({
  tasks: z.array(extractedTaskSchema).max(30),
  notes: z.string().max(500).optional(),
});

export type ExtractResponse = z.infer<typeof extractResponseSchema>;

/**
 * Production extraction runs on AWS Lambda via Amazon Bedrock.
 * What is sent to Bedrock:
 * - Notebook photo bytes (JPG/PNG/WebP, max 8 MB) + extraction instructions
 * - Not sent: account identity, other days' plans, or reward history
 * Real photos must never be written to demo fixtures or application logs.
 * HEIC/HEIF is converted to high-quality JPEG in the browser before upload.
 */
export const AI_DATA_NOTICE = `
Sent to Bedrock: notebook photo bytes + extraction instructions only.
Not sent: account identity, other days' plans, or reward history.
` as const;
