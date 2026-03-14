import React from "react";
import { Composition } from "remotion";
import { DentalExplainer } from "./compositions/DentalExplainer";
import { QuickTip } from "./compositions/QuickTip";
import { BeforeAfter } from "./compositions/BeforeAfter";
import { Testimonial } from "./compositions/Testimonial";
import { DEFAULT_BRAND_KIT } from "./utils/brandKit";
import {
  DentalExplainerSchema,
  QuickTipSchema,
  BeforeAfterSchema,
  TestimonialSchema,
} from "./utils/schemas";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

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

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DentalExplainer"
        component={DentalExplainer}
        schema={DentalExplainerSchema}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          brandKit: DEFAULT_BRAND_KIT,
          videoUrl:
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
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
          videoUrl:
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
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
          beforeImageUrl:
            "https://placehold.co/1080x1920/1a1a2e/ffffff?text=Before",
          afterImageUrl:
            "https://placehold.co/1080x1920/0a0a0f/02FEEF?text=After",
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
          videoUrl:
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
          words: sampleWords,
          patientName: "Sarah M.",
          quoteHighlight:
            "Best dental experience my kids have ever had!",
          starRating: 5,
        }}
      />
    </>
  );
};
