import { z } from "zod";

export const presentationTypeSchema = z.enum(["sales", "strategy", "project", "proposal", "other"]);
export const templateFamilySchema = z.enum([
  "blue-architectural",
  "editorial-signal",
  "strategic-frameworks",
  "human-centered-sales"
]);
export const layoutKindSchema = z.enum([
  "hero",
  "challenge",
  "proof",
  "process",
  "industry-grid",
  "comparison",
  "quote",
  "cta"
]);

export const questionSchema = z.object({
  id: z.string(),
  question: z.string(),
  reason: z.string(),
  answer: z.string().default(""),
  assumption: z.string().default("")
});

export const outlineItemSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  purpose: z.string(),
  headline: z.string(),
  keyMessage: z.string(),
  recommendedLayout: layoutKindSchema
});

export const statItemSchema = z.object({
  label: z.string(),
  value: z.string()
});

export const slideContentSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  purpose: z.string(),
  layoutKind: layoutKindSchema,
  eyebrow: z.string().default(""),
  headline: z.string(),
  subheadline: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  stats: z.array(statItemSchema).default([]),
  steps: z.array(z.string()).default([]),
  leftColumnTitle: z.string().default(""),
  leftColumnPoints: z.array(z.string()).default([]),
  rightColumnTitle: z.string().default(""),
  rightColumnPoints: z.array(z.string()).default([]),
  quote: z.string().default(""),
  quoteAttribution: z.string().default(""),
  ctaText: z.string().default(""),
  ctaSubtext: z.string().default(""),
  contactLine: z.string().default(""),
  imageAssetIds: z.array(z.string()).default([]),
  notes: z.string().default("")
});

export const briefSchema = z.object({
  rawPrompt: z.string().min(10),
  type: presentationTypeSchema,
  audience: z.string().default(""),
  outcome: z.string().default(""),
  context: z.string().default(""),
  requestedSlideCount: z.number().int().min(4).max(14).default(8)
});

export const assetSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number().nonnegative(),
  path: z.string(),
  extractedText: z.string().default(""),
  createdAt: z.string()
});

export const adminSettingsSchema = z.object({
  systemPrompt: z.string(),
  writingRules: z.array(z.string()),
  bannedWords: z.array(z.string()),
  imageGuidance: z.string(),
  salesDeckBias: z.string(),
  preferredTemplateFamily: templateFamilySchema
});

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum(["draft", "questions", "outline", "generated", "edited"]),
  brief: briefSchema.nullable(),
  templateFamily: templateFamilySchema,
  questions: z.array(questionSchema),
  outline: z.array(outlineItemSchema),
  slides: z.array(slideContentSchema),
  assets: z.array(assetSchema),
  revisions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    createdAt: z.string()
  }))
});

export type AdminSettings = z.infer<typeof adminSettingsSchema>;
export type AssetRecord = z.infer<typeof assetSchema>;
export type BriefInput = z.infer<typeof briefSchema>;
export type OutlineItem = z.infer<typeof outlineItemSchema>;
export type ProjectRecord = z.infer<typeof projectSchema>;
export type SlideContent = z.infer<typeof slideContentSchema>;
export type TemplateFamilyId = z.infer<typeof templateFamilySchema>;
