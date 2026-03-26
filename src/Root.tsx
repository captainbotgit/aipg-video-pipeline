import React from "react";
import { Composition } from "remotion";

// ── Original 4 compositions (A-Roll + Captions) ────────────────────────────
import { DentalExplainer } from "./compositions/DentalExplainer";
import { QuickTip } from "./compositions/QuickTip";
import { BeforeAfter } from "./compositions/BeforeAfter";
import { Testimonial } from "./compositions/Testimonial";

// ── Migrated 4 compositions (Motion Graphics) ─────────────────────────────
import { DidYouKnow } from "./compositions/DidYouKnow";
import { PatientStory } from "./compositions/PatientStory";
import { ProcedureSpotlight } from "./compositions/ProcedureSpotlight";
import { BeforeAfterReveal } from "./compositions/BeforeAfterReveal";

import { DEFAULT_BRAND_KIT } from "./utils/brandKit";
import {
  DentalExplainerSchema,
  QuickTipSchema,
  BeforeAfterSchema,
  TestimonialSchema,
  DidYouKnowSchema,
  PatientStorySchema,
  ProcedureSpotlightSchema,
  BeforeAfterRevealSchema,
} from "./utils/schemas";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

// ── Shared sample data for Remotion Studio previews ────────────────────────

const sampleWords = [
  { word: "Did", start: 0.5, end: 0.7 },
  { word: "you", start: 0.7, end: 0.85 },
  { word: "know", start: 0.85, end: 1.1 },
  { word: "that", start: 1.1, end: 1.3 },
  { word: "sealants", start: 1.3, end: 1.8 },
  { word: "can", start: 1.85, end: 2.0 },
  { word: "prevent", start: 2.0, end: 2.4 },
  { word: "up", start: 2.45, end: 2.6 },
  { word: "to", start: 2.6, end: 2.7 },
  { word: "80%", start: 2.7, end: 3.1 },
  { word: "of", start: 3.15, end: 3.3 },
  { word: "cavities", start: 3.3, end: 3.8 },
  { word: "in", start: 3.85, end: 4.0 },
  { word: "children", start: 4.0, end: 4.5 },
];

const sampleDirector = {
  hook: {
    text: "This Changes Everything",
    duration_seconds: 3,
    style: "bold_animated" as const,
  },
  scenes: [
    {
      start: 0,
      end: 15,
      type: "a_roll" as const,
      caption_emphasis: ["sealants", "80%", "cavities"],
      broll_prompt: null,
      transition_in: "fade" as const,
    },
  ],
  cta: {
    text: "Book Your Visit",
    placement: "end_card" as const,
    duration_seconds: 3,
  },
};

const PLACEHOLDER_BEFORE =
  "https://placehold.co/1080x1920/1a1a2e/ffffff?text=Before";
const PLACEHOLDER_AFTER =
  "https://placehold.co/1080x1920/0a0a0f/02FEEF?text=After";

// ── Remotion Root ──────────────────────────────────────────────────────────

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Original 4: A-Roll + Captions ─────────────────────────────── */}

      <Composition
        id="DentalExplainer"
        component={DentalExplainer}
        schema={DentalExplainerSchema}
        durationInFrames={60 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          videoUrl: "test-video.mp4",
          words: sampleWords,
          director: sampleDirector,
          brollUrls: {},
        }}
      />

      <Composition
        id="QuickTip"
        component={QuickTip}
        schema={QuickTipSchema}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          videoUrl: "test-video.mp4",
          words: sampleWords,
          hookText: "3 Things Your Dentist Wants You to Know",
          tipNumber: 1,
        }}
      />

      <Composition
        id="BeforeAfter"
        component={BeforeAfter}
        schema={BeforeAfterSchema}
        durationInFrames={10 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          beforeImageUrl: PLACEHOLDER_BEFORE,
          afterImageUrl: PLACEHOLDER_AFTER,
          patientQuote: "I can't believe the difference!",
          procedureName: "Teeth Whitening",
        }}
      />

      <Composition
        id="Testimonial"
        component={Testimonial}
        schema={TestimonialSchema}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          videoUrl: "test-video.mp4",
          words: sampleWords,
          patientName: "Sarah M.",
          quoteHighlight: "Best dental experience my kids have ever had!",
          starRating: 5,
        }}
      />

      {/* ── Migrated 4: Motion Graphics (no video required) ───────────── */}

      <Composition
        id="DidYouKnow"
        component={DidYouKnow}
        schema={DidYouKnowSchema}
        durationInFrames={18 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          hookText: "Did You Know?",
          bullets: [
            "Sealants prevent up to 80% of cavities in children",
            "Most dental problems are entirely preventable",
            "Regular cleanings save thousands in future costs",
          ],
          ctaText: "Book Your Free Consultation",
        }}
      />

      <Composition
        id="PatientStory"
        component={PatientStory}
        schema={PatientStorySchema}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          patientName: "Sarah M.",
          location: "Atlanta, GA",
          quote:
            "I was terrified of the dentist for years. The team here completely changed my experience — I actually look forward to my visits now!",
          rating: 5,
          ctaText: "Book Your Consultation Today",
        }}
      />

      <Composition
        id="ProcedureSpotlight"
        component={ProcedureSpotlight}
        schema={ProcedureSpotlightSchema}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          procedureName: "Invisalign",
          problem: "Crooked teeth affecting your confidence?",
          benefits: [
            "Nearly invisible aligners",
            "Remove to eat & brush normally",
            "Results in as little as 6 months",
          ],
          stat: "Over 14 million patients treated worldwide",
          ctaText: "Get Your Free Smile Assessment",
        }}
      />

      <Composition
        id="BeforeAfterReveal"
        component={BeforeAfterReveal}
        schema={BeforeAfterRevealSchema}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          beforeImage: PLACEHOLDER_BEFORE,
          afterImage: PLACEHOLDER_AFTER,
          resultText: "Complete smile transformation in just 3 visits",
          quote: "I finally have the smile I always dreamed of",
          ctaText: "Start Your Transformation",
        }}
      />
    </>
  );
};
