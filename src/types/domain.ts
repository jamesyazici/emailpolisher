import { z } from 'zod';

export const EmailCategorySchema = z.enum(['networking', 'followup', 'referral', 'thankyou', 'other']);
export type EmailCategory = z.infer<typeof EmailCategorySchema>;

export const ToneSettingsSchema = z.object({
  formality: z.number().int().min(1).max(5),
  confidence: z.number().int().min(1).max(5),
  seniority: z.enum(['student', 'professional']),
  length: z.enum(['short', 'medium', 'long']),
});
export type ToneSettings = z.infer<typeof ToneSettingsSchema>;

export const DraftInputSchema = z.object({
  text: z.string().min(1, "Text cannot be empty"),
  tone: ToneSettingsSchema,
  overrides: z.record(z.string(), z.string()).optional(),
});
export type DraftInput = z.infer<typeof DraftInputSchema>;

export const DraftOutputSchema = z.object({
  subject: z.string(),
  greeting: z.string(),
  bodySections: z.array(z.string()),
  closing: z.string(),
});
export type DraftOutput = z.infer<typeof DraftOutputSchema>;

export const CheckResultSchema = z.object({
  completeness: z.boolean(),
  professionalism: z.boolean(),
  clarity: z.boolean(),
  ethical: z.boolean(),
  warnings: z.array(z.string()),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;