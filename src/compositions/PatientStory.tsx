/**
 * PatientStory composition — migrated from aipg-video-templates
 * Adapted to use BrandKit (pipeline schema) instead of flat BrandProps.
 *
 * Duration: 30s (900 frames @ 30fps)
 * Sections: Title (3s) → Patient Info (2s) → Karaoke Quote (15s) → Stars (5s) → CTA (5s)
 */

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from "remotion";
import { BrandKit } from "../utils/brandKit";
import { adaptBrandKit } from "../utils/brandAdapter";
import { Background } from "../components/Background";
import { Logo } from "../components/Logo";
import { CTACard } from "../components/CTACard";

export type PatientStoryProps = {
  brandKit: BrandKit;
  patientName: string;
  location: string;
  quote: string;
  rating: number;
  ctaText?: string;
};

export const PatientStory: React.FC<PatientStoryProps> = (props) => {
  const {
    patientName,
    location,
    quote,
    rating,
    ctaText = "Book Your Consultation Today",
    brandKit,
  } = props;
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

      {/* Title card: 0-3s */}
      <Sequence from={0} durationInFrames={90}>
        <TitleCard
          textColor={brand.textColor}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Patient name + location: 3-5s */}
      <Sequence from={90} durationInFrames={60}>
        <PatientInfo
          name={patientName}
          location={location}
          textColor={brand.textColor}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Quote karaoke: 5-20s */}
      <Sequence from={150} durationInFrames={450}>
        <KaraokeQuote
          quote={quote}
          name={patientName}
          textColor={brand.textColor}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Star rating: 20-25s */}
      <Sequence from={600} durationInFrames={150}>
        <StarRating
          rating={rating}
          accentColor={brand.accentColor}
          textColor={brand.textColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* CTA: 25-30s */}
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
  textColor: string;
  accentColor: string;
  fontFamily: string;
}> = ({ textColor, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 70, 90], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", opacity }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 80,
          color: textColor,
          textAlign: "center",
        }}
      >
        Patient Story
      </div>
      <div
        style={{
          width: 80,
          height: 4,
          backgroundColor: accentColor,
          marginTop: 20,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

const PatientInfo: React.FC<{
  name: string;
  location: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}> = ({ name, location, textColor, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = spring({ frame, fps, config: { damping: 12 } });
  const y = interpolate(slideUp, [0, 1], [60, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 64,
          color: textColor,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 400,
          fontSize: 32,
          color: accentColor,
          marginTop: 8,
        }}
      >
        {location}
      </div>
    </AbsoluteFill>
  );
};

const KaraokeQuote: React.FC<{
  quote: string;
  name: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}> = ({ quote, name, textColor, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const words = quote.split(" ");
  const framesPerWord = Math.floor(450 / words.length);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{ fontSize: 28, fontFamily, color: accentColor, marginBottom: 20 }}
      >
        {"\u201C"}
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 500,
          fontSize: 44,
          lineHeight: 1.6,
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 12px",
        }}
      >
        {words.map((word, i) => {
          const isHighlighted = frame >= i * framesPerWord;
          return (
            <span
              key={i}
              style={{ color: isHighlighted ? textColor : "#D1D5DB" }}
            >
              {word}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 32,
          color: "#9CA3AF",
          marginTop: 40,
        }}
      >
        — {name}
      </div>
    </AbsoluteFill>
  );
};

const StarRating: React.FC<{
  rating: number;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ rating, accentColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const delay = star * 8;
          const fillProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 8, stiffness: 100 },
          });
          const isFilled = star <= rating;
          const scale = interpolate(fillProgress, [0, 1], [0.3, 1]);
          const opacity = interpolate(fillProgress, [0, 1], [0.2, 1]);

          return (
            <div
              key={star}
              style={{
                fontSize: 72,
                transform: `scale(${scale})`,
                opacity,
                color: isFilled ? accentColor : "#D1D5DB",
              }}
            >
              ★
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 32,
          color: textColor,
          marginTop: 30,
          opacity: interpolate(frame, [50, 70], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
        }}
      >
        {rating} out of 5 stars
      </div>
    </AbsoluteFill>
  );
};
