import { z } from 'zod';
export declare const EmailCategorySchema: z.ZodEnum<["networking", "followup", "referral", "thankyou", "other"]>;
export type EmailCategory = z.infer<typeof EmailCategorySchema>;
export declare const ToneSettingsSchema: z.ZodObject<{
    formality: z.ZodNumber;
    confidence: z.ZodNumber;
    seniority: z.ZodEnum<["student", "professional"]>;
    length: z.ZodEnum<["short", "medium", "long"]>;
}, "strip", z.ZodTypeAny, {
    length: "short" | "medium" | "long";
    formality: number;
    confidence: number;
    seniority: "student" | "professional";
}, {
    length: "short" | "medium" | "long";
    formality: number;
    confidence: number;
    seniority: "student" | "professional";
}>;
export type ToneSettings = z.infer<typeof ToneSettingsSchema>;
export declare const DraftInputSchema: z.ZodObject<{
    text: z.ZodString;
    tone: z.ZodObject<{
        formality: z.ZodNumber;
        confidence: z.ZodNumber;
        seniority: z.ZodEnum<["student", "professional"]>;
        length: z.ZodEnum<["short", "medium", "long"]>;
    }, "strip", z.ZodTypeAny, {
        length: "short" | "medium" | "long";
        formality: number;
        confidence: number;
        seniority: "student" | "professional";
    }, {
        length: "short" | "medium" | "long";
        formality: number;
        confidence: number;
        seniority: "student" | "professional";
    }>;
    overrides: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    tone: {
        length: "short" | "medium" | "long";
        formality: number;
        confidence: number;
        seniority: "student" | "professional";
    };
    overrides?: Record<string, string> | undefined;
}, {
    text: string;
    tone: {
        length: "short" | "medium" | "long";
        formality: number;
        confidence: number;
        seniority: "student" | "professional";
    };
    overrides?: Record<string, string> | undefined;
}>;
export type DraftInput = z.infer<typeof DraftInputSchema>;
export declare const DraftOutputSchema: z.ZodObject<{
    subject: z.ZodString;
    greeting: z.ZodString;
    bodySections: z.ZodArray<z.ZodString, "many">;
    closing: z.ZodString;
}, "strip", z.ZodTypeAny, {
    subject: string;
    greeting: string;
    bodySections: string[];
    closing: string;
}, {
    subject: string;
    greeting: string;
    bodySections: string[];
    closing: string;
}>;
export type DraftOutput = z.infer<typeof DraftOutputSchema>;
export declare const CheckResultSchema: z.ZodObject<{
    completeness: z.ZodBoolean;
    professionalism: z.ZodBoolean;
    clarity: z.ZodBoolean;
    ethical: z.ZodBoolean;
    warnings: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    completeness: boolean;
    professionalism: boolean;
    clarity: boolean;
    ethical: boolean;
    warnings: string[];
}, {
    completeness: boolean;
    professionalism: boolean;
    clarity: boolean;
    ethical: boolean;
    warnings: string[];
}>;
export type CheckResult = z.infer<typeof CheckResultSchema>;
//# sourceMappingURL=domain.d.ts.map