/**
 * BeforeAfterReveal composition — migrated from aipg-video-templates
 * Adapted to use BrandKit (pipeline schema) instead of flat BrandProps.
 *
 * Duration: 30s (900 frames @ 30fps)
 * Sections: Title (2s) → Before (3s) → Wipe (3s) → After (4s) → Results (8s) → Quote (5s) → CTA (5s)
 */

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
  Img,
} from "remotion";
import { BrandKit } from "../utils/brandKit";
import { adaptBrandKit } from "../utils/brandAdapter";
import { Background } from "../components/Background";
import { Logo } from "../components/Logo";
import { CTACard } from "../components/CTACard";

export type BeforeAfterRevealProps = {
  brandKit: BrandKit;
  beforeImage: string;
  afterImage: string;
  resultText: string;
  quote: string;
  ctaText: string;
};

export const BeforeAfterReveal: React.FC<BeforeAfterRevealProps> = (props) => {
  const { beforeImage, afterImage, resultText, quote, ctaText, brandKit } =
    props;
  const brand = adaptBrandKit(brandKit);

  return (
    <AbsoluteFill>
      <Background backgroundColor={brand.backgroundColor} />
      <Logo
        logoText={brand.logoText}
        logoUrl={brand.logoUrl}
        textColor={brand.textColor}
        fontFamily={brand.fontFamily}
      />

      {/* Title: 0-2s (frames 0-60) */}
      <Sequence from={0} durationInFrames={60}>
        <TitleCard
          accentColor={brand.accentColor}
          textColor={brand.textColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Before: 2-5s (frames 60-150) */}
      <Sequence from={60} durationInFrames={90}>
        <ImageSlot
          label="Before"
          image={beforeImage}
          textColor={brand.textColor}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Wipe transition + After: 5-8s (frames 150-240) */}
      <Sequence from={150} durationInFrames={90}>
        <WipeReveal
          beforeImage={beforeImage}
          afterImage={afterImage}
          accentColor={brand.accentColor}
        />
      </Sequence>

      {/* After reveal: 8-12s (frames 240-360) */}
      <Sequence from={240} durationInFrames={120}>
        <ImageSlot
          label="After"
          image={afterImage}
          textColor={brand.textColor}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Results text overlay: 12-20s (frames 360-600) */}
      <Sequence from={360} durationInFrames={240}>
        <ResultsOverlay
          text={resultText}
          textColor={brand.textColor}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Patient quote: 20-25s (frames 600-750) */}
      <Sequence from={600} durationInFrames={150}>
        <QuoteCard
          quote={quote}
          textColor={brand.textColor}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* CTA: 25-30s (frames 750-900) */}
      <Sequence from={750} durationInFrames={150}>
        <CTACard
          text={ctaText}
          startFrame={0}
          accentColor={brand.accentColor}
          textColor={brand.textColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{
  accentColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ accentColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 60 } });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 80,
          color: textColor,
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        Transformation
      </div>
      <div
        style={{
          width: 120,
          height: 4,
          backgroundColor: accentColor,
          marginTop: 20,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

const ImageSlot: React.FC<{
  label: string;
  image: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}> = ({ label, image, textColor, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", opacity }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 36,
          color: accentColor,
          textTransform: "uppercase",
          letterSpacing: 6,
          marginBottom: 24,
        }}
      >
        {label}
      </div>
      <div
        style={{
          width: 800,
          height: 800,
          borderRadius: 24,
          overflow: "hidden",
          border: `4px solid ${accentColor}`,
        }}
      >
        <Img
          src={image}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};

const WipeReveal: React.FC<{
  beforeImage: string;
  afterImage: string;
  accentColor: string;
}> = ({ beforeImage, afterImage, accentColor }) => {
  const frame = useCurrentFrame();

  const wipeProgress = interpolate(frame, [0, 60], [0, 100], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          width: 800,
          height: 800,
          borderRadius: 24,
          overflow: "hidden",
          position: "relative",
          border: `4px solid ${accentColor}`,
        }}
      >
        <Img
          src={beforeImage}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            clipPath: `inset(0 ${100 - wipeProgress}% 0 0)`,
          }}
        >
          <Img
            src={afterImage}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        {/* Divider line */}
        <div
          style={{
            position: "absolute",
            left: `${wipeProgress}%`,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: accentColor,
            transform: "translateX(-50%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const ResultsOverlay: React.FC<{
  text: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}> = ({ text, textColor, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = spring({ frame, fps, config: { damping: 14 } });
  const y = interpolate(slideUp, [0, 1], [60, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 300,
          fontSize: 28,
          color: accentColor,
          textTransform: "uppercase",
          letterSpacing: 4,
          marginBottom: 24,
        }}
      >
        Results
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 52,
          color: textColor,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const QuoteCard: React.FC<{
  quote: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}> = ({ quote, textColor, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12 } });
  const scale = interpolate(entrance, [0, 1], [0.8, 1]);
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
        opacity,
      }}
    >
      <div
        style={{
          backgroundColor: `${accentColor}15`,
          borderRadius: 24,
          padding: "48px 40px",
          borderLeft: `6px solid ${accentColor}`,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 28,
            color: accentColor,
            marginBottom: 12,
          }}
        >
          {"\u201C"}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 500,
            fontSize: 40,
            color: textColor,
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {quote}
        </div>
      </div>
    </AbsoluteFill>
  );
};
