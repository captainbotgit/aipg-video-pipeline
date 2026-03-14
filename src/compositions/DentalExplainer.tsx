import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Video,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { AnimatedCaption } from "../components/AnimatedCaption";
import { BrandOverlay } from "../components/BrandOverlay";
import { HookCard } from "../components/HookCard";
import { EndCard } from "../components/EndCard";
import { SceneTransition } from "../components/Transition";
import { FONT_CSS } from "../utils/fonts";
import { DentalExplainerSchema } from "../utils/schemas";

export type DentalExplainerProps = z.infer<typeof DentalExplainerSchema>;

export const DentalExplainer: React.FC<DentalExplainerProps> = ({
  brandKit,
  videoUrl,
  words,
  director,
  brollUrls = {},
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  const hookDuration = director.hook
    ? Math.round((director.hook.duration_seconds || 3) * fps)
    : 0;

  const ctaDuration = director.cta
    ? Math.round((director.cta.duration_seconds || 3) * fps)
    : Math.round(3 * fps);

  const ctaStart = durationInFrames - ctaDuration;

  // Gather all emphasis words from scenes
  const allEmphasis = director.scenes.flatMap(
    (s) => s.caption_emphasis || []
  );

  return (
    <AbsoluteFill style={{ backgroundColor: brandKit.background_color }}>
      <style>{FONT_CSS}</style>

      {/* A-Roll base video — always playing underneath */}
      <AbsoluteFill>
        <Video
          src={videoUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Hook overlay */}
      {director.hook && hookDuration > 0 && (
        <Sequence durationInFrames={hookDuration}>
          <HookCard
            text={director.hook.text}
            primaryColor={brandKit.primary_color}
            secondaryColor={brandKit.secondary_color}
            durationFrames={hookDuration}
            style={director.hook.style}
          />
        </Sequence>
      )}

      {/* B-roll scene overlays */}
      {director.scenes.map((scene, idx) => {
        if (scene.type !== "b_roll") return null;
        const brollUrl = scene.broll_url || brollUrls[idx];
        if (!brollUrl) return null;

        const startFrame = Math.round(scene.start * fps);
        const endFrame = Math.round(scene.end * fps);
        const sceneDuration = endFrame - startFrame;

        return (
          <Sequence
            key={idx}
            from={startFrame}
            durationInFrames={sceneDuration}
          >
            <SceneTransition
              transitionIn={scene.transition_in || "crossfade"}
              transitionOut={scene.transition_out || "crossfade"}
              totalDuration={sceneDuration}
            >
              <Video
                src={brollUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </SceneTransition>
          </Sequence>
        );
      })}

      {/* Brand overlay (logo, gradients) */}
      <BrandOverlay brandKit={brandKit} />

      {/* Animated captions */}
      <AnimatedCaption
        words={words}
        primaryColor={brandKit.primary_color}
        secondaryColor={brandKit.secondary_color}
        emphasizedWords={allEmphasis}
      />

      {/* End card with CTA */}
      <Sequence from={ctaStart} durationInFrames={ctaDuration}>
        <EndCard
          brandKit={brandKit}
          ctaOverride={director.cta?.text}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
