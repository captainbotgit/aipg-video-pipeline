import { z } from "zod";

export const SceneSchema = z.object({
  start: z.number(),
  end: z.number(),
  type: z.enum(["a_roll", "b_roll"]),
  caption_emphasis: z.array(z.string()).optional(),
  broll_prompt: z.string().nullable().optional(),
  broll_url: z.string().optional(),
  transition_in: z
    .enum(["fade", "crossfade", "zoom_reveal", "slide_blur", "cut"])
    .optional(),
  transition_out: z
    .enum(["fade", "crossfade", "zoom_reveal", "slide_blur", "cut"])
    .optional(),
});

export const HookSchema = z.object({
  text: z.string(),
  duration_seconds: z.number().default(3),
  style: z.enum(["bold_animated", "subtle", "question"]).default("bold_animated"),
});

export const CTASchema = z.object({
  text: z.string(),
  placement: z.enum(["end_card", "lower_third", "overlay"]).default("end_card"),
  duration_seconds: z.number().default(3),
});

export const PacingSchema = z.object({
  cuts: z.array(z.number()).optional(),
  energy: z.array(z.number()).optional(),
});

export const DirectorOutputSchema = z.object({
  hook: HookSchema.optional(),
  scenes: z.array(SceneSchema),
  cta: CTASchema.optional(),
  music: z
    .object({
      mood: z.string().optional(),
      energy_curve: z.string().optional(),
    })
    .optional(),
  pacing: PacingSchema.optional(),
});

export type DirectorOutput = z.infer<typeof DirectorOutputSchema>;
export type Scene = z.infer<typeof SceneSchema>;

export function parseDirectorOutput(input: unknown): DirectorOutput {
  return DirectorOutputSchema.parse(input);
}
