import { z } from "zod";
import { BrandKitSchema } from "./brandKit";
import { WordTimestampSchema } from "./captionParser";
import { DirectorOutputSchema } from "./directorParser";

// ─── Original 4 Compositions (A-Roll + Captions) ─────────────────────────────

export const DentalExplainerSchema = z.object({
  brandKit: BrandKitSchema,
  videoUrl: z.string(),
  words: z.array(WordTimestampSchema),
  director: DirectorOutputSchema,
  brollUrls: z.record(z.string(), z.string()).optional(),
});

export const QuickTipSchema = z.object({
  brandKit: BrandKitSchema,
  videoUrl: z.string(),
  words: z.array(WordTimestampSchema),
  hookText: z.string(),
  tipNumber: z.number().optional(),
  ctaText: z.string().optional(),
});

export const BeforeAfterSchema = z.object({
  brandKit: BrandKitSchema,
  beforeImageUrl: z.string(),
  afterImageUrl: z.string(),
  patientQuote: z.string().optional(),
  procedureName: z.string().optional(),
  ctaText: z.string().optional(),
});

export const TestimonialSchema = z.object({
  brandKit: BrandKitSchema,
  videoUrl: z.string(),
  words: z.array(WordTimestampSchema),
  patientName: z.string().optional(),
  quoteHighlight: z.string().optional(),
  starRating: z.number().optional(),
  ctaText: z.string().optional(),
});

// ─── Migrated 4 Compositions (Motion Graphics — no video required) ────────────

export const DidYouKnowSchema = z.object({
  brandKit: BrandKitSchema,
  hookText: z.string(),
  bullets: z.array(z.string()).min(1).max(3),
  ctaText: z.string(),
});

export const PatientStorySchema = z.object({
  brandKit: BrandKitSchema,
  patientName: z.string(),
  location: z.string(),
  quote: z.string(),
  rating: z.number().min(1).max(5),
  ctaText: z.string().optional(),
});

export const ProcedureSpotlightSchema = z.object({
  brandKit: BrandKitSchema,
  procedureName: z.string(),
  problem: z.string(),
  benefits: z.array(z.string()).min(1).max(3),
  stat: z.string(),
  ctaText: z.string(),
});

export const BeforeAfterRevealSchema = z.object({
  brandKit: BrandKitSchema,
  beforeImage: z.string().url(),
  afterImage: z.string().url(),
  resultText: z.string(),
  quote: z.string(),
  ctaText: z.string(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type DentalExplainerInput = z.infer<typeof DentalExplainerSchema>;
export type QuickTipInput = z.infer<typeof QuickTipSchema>;
export type BeforeAfterInput = z.infer<typeof BeforeAfterSchema>;
export type TestimonialInput = z.infer<typeof TestimonialSchema>;
export type DidYouKnowInput = z.infer<typeof DidYouKnowSchema>;
export type PatientStoryInput = z.infer<typeof PatientStorySchema>;
export type ProcedureSpotlightInput = z.infer<typeof ProcedureSpotlightSchema>;
export type BeforeAfterRevealInput = z.infer<typeof BeforeAfterRevealSchema>;
