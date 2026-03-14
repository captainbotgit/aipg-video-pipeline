import { z } from "zod";
import { BrandKitSchema } from "./brandKit";
import { WordTimestampSchema } from "./captionParser";
import { DirectorOutputSchema } from "./directorParser";

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
