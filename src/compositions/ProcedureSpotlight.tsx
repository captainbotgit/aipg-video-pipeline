/**
 * ProcedureSpotlight composition — migrated from aipg-video-templates
 * Adapted to use BrandKit (pipeline schema) instead of flat BrandProps.
 *
 * Duration: 30s (900 frames @ 30fps)
 * Sections: Title (2s) → Problem (6s) → Benefit Cards (7s) → Stat (7s) → CTA (8s)
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

export type ProcedureSpotlightProps = {
  brandKit: BrandKit;
  procedureName: string;
  problem: string;
  benefits: string[];
  stat: string;
  ctaText: string;
};

export const ProcedureSpotlight: React.FC<ProcedureSpotlightProps> = (
  props
) => {
  const { procedureName, problem, benefits, stat, ctaText, brandKit } = props;
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

      {/* Title card: 0-2s (frames 0-60) */}
      <Sequence from={0} durationInFrames={60}>
        <TitleCard
          name={procedureName}
          accentColor={brand.accentColor}
          textColor={brand.textColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Problem statement: 2-8s (frames 60-240) */}
      <Sequence from={60} durationInFrames={180}>
        <ProblemStatement
          text={problem}
          textColor={brand.textColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Benefit cards: 8-15s (frames 240-450) */}
      {benefits.slice(0, 3).map((benefit, i) => {
        const start = 240 + i * 70;
        return (
          <Sequence key={i} from={start} durationInFrames={210 - i * 70}>
            <BenefitCard
              text={benefit}
              index={i}
              primaryColor={brand.primaryColor}
              accentColor={brand.accentColor}
              textColor={brand.textColor}
              fontFamily={brand.fontFamily}
            />
          </Sequence>
        );
      })}

      {/* Social proof stat: 15-22s (frames 450-660) */}
      <Sequence from={450} durationInFrames={210}>
        <StatDisplay
          stat={stat}
          accentColor={brand.accentColor}
          textColor={brand.textColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* CTA: 22-30s (frames 660-900) */}
      <Sequence from={660} durationInFrames={240}>
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
  name: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ name, accentColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 60 } });
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", opacity }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 300,
          fontSize: 32,
          color: textColor,
          textTransform: "uppercase",
          letterSpacing: 6,
          marginBottom: 16,
        }}
      >
        Spotlight
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 80,
          color: accentColor,
          textAlign: "center",
          padding: "0 60px",
          lineHeight: 1.1,
          transform: `scale(${scale})`,
        }}
      >
        {name}
      </div>
    </AbsoluteFill>
  );
};

const ProblemStatement: React.FC<{
  text: string;
  textColor: string;
  fontFamily: string;
}> = ({ text, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = spring({ frame, fps, config: { damping: 14 } });
  const y = interpolate(slideUp, [0, 1], [80, 0]);
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

const BenefitCard: React.FC<{
  text: string;
  index: number;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ text, index, primaryColor, accentColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const x = interpolate(entrance, [0, 1], [400, 0]);
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", paddingLeft: 80, paddingRight: 80 }}
    >
      <div
        style={{
          transform: `translateX(${x}px)`,
          opacity,
          marginTop: index * 200 - 200,
          display: "flex",
          alignItems: "center",
          gap: 28,
          backgroundColor: `${primaryColor}12`,
          padding: "32px 40px",
          borderRadius: 20,
          borderLeft: `6px solid ${accentColor}`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 40,
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {"\u2713"}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 600,
            fontSize: 40,
            color: textColor,
            lineHeight: 1.3,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StatDisplay: React.FC<{
  stat: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ stat, accentColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 8, stiffness: 60 } });
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
          fontWeight: 300,
          fontSize: 28,
          color: textColor,
          textTransform: "uppercase",
          letterSpacing: 4,
          marginBottom: 24,
        }}
      >
        Did you know?
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 64,
          color: accentColor,
          textAlign: "center",
          padding: "0 80px",
          lineHeight: 1.3,
          transform: `scale(${scale})`,
        }}
      >
        {stat}
      </div>
    </AbsoluteFill>
  );
};
