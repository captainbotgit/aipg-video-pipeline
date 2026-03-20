import React from "react";
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { z } from "zod";
import { AnimatedCaption } from "../components/AnimatedCaption";
import { BrandOverlay } from "../components/BrandOverlay";
import { EndCard } from "../components/EndCard";
import { FONT_CSS, FONT_FAMILIES } from "../utils/fonts";
import { hexToRgba } from "../utils/brandKit";
import { TestimonialSchema } from "../utils/schemas";

export type TestimonialProps = z.infer<typeof TestimonialSchema>;

export const Testimonial: React.FC<TestimonialProps> = ({
  brandKit,
  videoUrl,
  words,
  patientName,
  quoteHighlight,
  starRating = 5,
  ctaText,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const ctaDuration = Math.round(3 * fps);
  const ctaStart = durationInFrames - ctaDuration;

  const resolvedVideoUrl = videoUrl.startsWith("http")
    ? videoUrl
    : staticFile(videoUrl);

  return (
    <AbsoluteFill style={{ backgroundColor: brandKit.background_color }}>
      <style>{FONT_CSS}</style>

      {/* Full-screen patient video */}
      <AbsoluteFill>
        <OffthreadVideo
          src={resolvedVideoUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Star rating badge */}
      <StarBadge
        rating={starRating}
        primaryColor={brandKit.primary_color}
        accentColor={brandKit.accent_color}
      />

      {/* Quote highlight overlay (appears mid-video) */}
      {quoteHighlight && (
        <QuoteHighlight
          quote={quoteHighlight}
          patientName={patientName}
          primaryColor={brandKit.primary_color}
          secondaryColor={brandKit.secondary_color}
        />
      )}

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

const StarBadge: React.FC<{
  rating: number;
  primaryColor: string;
  accentColor: string;
}> = ({ rating, primaryColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.5 },
  });

  const stars = "★".repeat(Math.min(rating, 5));

  return (
    <div
      style={{
        position: "absolute",
        top: 160,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          borderRadius: 16,
          padding: "12px 32px",
          border: `2px solid ${hexToRgba(primaryColor, 0.3)}`,
        }}
      >
        <span
          style={{
            fontSize: 36,
            color: accentColor || "#FFD700",
            letterSpacing: "4px",
          }}
        >
          {stars}
        </span>
      </div>
    </div>
  );
};

const QuoteHighlight: React.FC<{
  quote: string;
  patientName?: string;
  primaryColor: string;
  secondaryColor: string;
}> = ({ quote, patientName, primaryColor, secondaryColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Show quote highlight at 40-70% of video
  const showStart = Math.round(durationInFrames * 0.4);
  const showEnd = Math.round(durationInFrames * 0.7);

  if (frame < showStart || frame > showEnd) return null;

  const localFrame = frame - showStart;
  const localDuration = showEnd - showStart;

  const entryOpacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const exitOpacity = interpolate(
    localFrame,
    [localDuration - 15, localDuration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const s = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.7 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "25%",
        left: 40,
        right: 40,
        opacity: Math.min(entryOpacity, exitOpacity),
        transform: `scale(${s})`,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          borderRadius: 24,
          padding: "36px 40px",
          borderLeft: `4px solid ${primaryColor}`,
        }}
      >
        {/* Quote mark */}
        <span
          style={{
            fontFamily: FONT_FAMILIES.headline,
            fontSize: 80,
            color: hexToRgba(primaryColor, 0.4),
            lineHeight: 0.5,
            display: "block",
            marginBottom: 12,
          }}
        >
          "
        </span>
        <p
          style={{
            fontFamily: FONT_FAMILIES.headline,
            fontWeight: 600,
            fontSize: 36,
            color: "#FFFFFF",
            lineHeight: 1.3,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {quote}
        </p>
        {patientName && (
          <p
            style={{
              fontFamily: FONT_FAMILIES.body,
              fontWeight: 500,
              fontSize: 22,
              color: primaryColor,
              marginTop: 16,
              margin: "16px 0 0",
            }}
          >
            — {patientName}
          </p>
        )}
      </div>
    </div>
  );
};
