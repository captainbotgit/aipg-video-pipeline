import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { z } from "zod";
import { AnimatedCaption } from "../components/AnimatedCaption";
import { BrandOverlay } from "../components/BrandOverlay";
import { EndCard } from "../components/EndCard";
import { FONT_CSS, FONT_FAMILIES } from "../utils/fonts";
import { hexToRgba } from "../utils/brandKit";
import { QuickTipSchema } from "../utils/schemas";

export type QuickTipProps = z.infer<typeof QuickTipSchema>;

export const QuickTip: React.FC<QuickTipProps> = ({
  brandKit,
  videoUrl,
  words,
  hookText,
  tipNumber = 1,
  ctaText,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const hookDuration = Math.round(3 * fps);
  const ctaDuration = Math.round(3 * fps);
  const ctaStart = durationInFrames - ctaDuration;

  return (
    <AbsoluteFill style={{ backgroundColor: brandKit.background_color }}>
      <style>{FONT_CSS}</style>

      {/* Speaker video with branded frame */}
      <AbsoluteFill>
        <Video
          src={videoUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Branded border glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: `3px solid ${hexToRgba(brandKit.primary_color, 0.2)}`,
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>

      {/* Tip number badge */}
      <TipBadge
        number={tipNumber}
        primaryColor={brandKit.primary_color}
        backgroundColor={brandKit.background_color}
      />

      {/* Hook text overlay */}
      <Sequence durationInFrames={hookDuration}>
        <HookOverlay
          text={hookText}
          primaryColor={brandKit.primary_color}
          secondaryColor={brandKit.secondary_color}
        />
      </Sequence>

      {/* Brand overlay */}
      <BrandOverlay brandKit={brandKit} />

      {/* Animated captions */}
      <AnimatedCaption
        words={words}
        primaryColor={brandKit.primary_color}
        secondaryColor={brandKit.secondary_color}
      />

      {/* End card */}
      <Sequence from={ctaStart} durationInFrames={ctaDuration}>
        <EndCard brandKit={brandKit} ctaOverride={ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};

const TipBadge: React.FC<{
  number: number;
  primaryColor: string;
  backgroundColor: string;
}> = ({ number, primaryColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.5 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 40,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.7)})`,
          borderRadius: 20,
          padding: "12px 24px",
          boxShadow: `0 4px 20px ${hexToRgba(primaryColor, 0.3)}`,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILIES.accent,
            fontWeight: 900,
            fontSize: 28,
            color: backgroundColor,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Tip #{number}
        </span>
      </div>
    </div>
  );
};

const HookOverlay: React.FC<{
  text: string;
  primaryColor: string;
  secondaryColor: string;
}> = ({ text, primaryColor, secondaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 160, mass: 0.6 },
  });

  const exitOpacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        opacity: exitOpacity,
      }}
    >
      <h1
        style={{
          fontFamily: FONT_FAMILIES.headline,
          fontWeight: 700,
          fontSize: 68,
          color: "#FFFFFF",
          textAlign: "center",
          padding: "0 60px",
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          textShadow: `0 4px 24px ${hexToRgba(primaryColor, 0.5)}`,
          transform: `scale(${s}) translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
          margin: 0,
        }}
      >
        {text}
      </h1>
    </div>
  );
};
