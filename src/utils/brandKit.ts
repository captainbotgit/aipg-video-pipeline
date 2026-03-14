import { z } from "zod";

export const BrandKitSchema = z.object({
  practice_name: z.string(),
  primary_color: z.string().default("#02FEEF"),
  secondary_color: z.string().default("#B55DFD"),
  accent_color: z.string().default("#FF6B6B"),
  background_color: z.string().default("#0A0A0F"),
  font_primary: z.string().default("Clash Display"),
  font_secondary: z.string().default("Inter"),
  logo_url: z.string().optional(),
  cta_text: z.string().default("Book Your Visit"),
  cta_url: z.string().optional(),
  voice_tone: z.array(z.string()).optional(),
  target_audience: z.string().optional(),
  music_mood: z.string().optional(),
});

export type BrandKit = z.infer<typeof BrandKitSchema>;

export const DEFAULT_BRAND_KIT: BrandKit = {
  practice_name: "AIPG Dental",
  primary_color: "#02FEEF",
  secondary_color: "#B55DFD",
  accent_color: "#FF6B6B",
  background_color: "#0A0A0F",
  font_primary: "Clash Display",
  font_secondary: "Inter",
  cta_text: "Book Your Visit",
};

export function parseBrandKit(input: unknown): BrandKit {
  return BrandKitSchema.parse(input);
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
