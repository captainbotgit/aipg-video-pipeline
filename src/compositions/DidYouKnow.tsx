/**
 * DidYouKnow composition — migrated from aipg-video-templates
 * Adapted to use BrandKit (pipeline schema) instead of flat BrandProps.
 *
 * Duration: 30s (900 frames @ 30fps) — 1080×1920 portrait
 * Layout zones:
 *   0–140px   : Logo (top-left)
 *   140–480px : Hook title area
 *   480–1480px: Bullet content zone (3 bullets, one at a time)
 *   1480–1920px: CTA zone
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

export type DidYouKnowProps = {
  brandKit: BrandKit;
  hookText: string;
  bullets: string[];
  ctaText: string;
};

export const DidYouKnow: React.FC<DidYouKnowProps> = (props) => {
  const { hookText, bullets, ctaText, brandKit } = props;
  const brand = adaptBrandKit(brandKit);

  return (
    <AbsoluteFill>
      <Background backgroundColor={brand.backgroundColor} videoUrl={brand.backgroundVideoUrl || undefined} />
      <Logo
        logoText={brand.logoText}
        logoUrl={brand.logoUrl}
        textColor={brand.textColor}
        fontFamily={brand.fontFamily}
      />

      {/* Hook text: 0–3s (frames 0–90) — upper third */}
      <Sequence from={0} durationInFrames={90}>
        <HookText
          text={hookText}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Bullets: 3–12s (frames 90–360) — one at a time, mid zone */}
      {bullets.slice(0, 3).map((bullet, i) => {
        const bulletStart = 90 + i * 90;
        return (
          <Sequence key={i} from={bulletStart} durationInFrames={90}>
            <BulletPoint
              text={bullet}
              index={i}
              total={Math.min(bullets.length, 3)}
              primaryColor={brand.primaryColor}
              accentColor={brand.accentColor}
              textColor={brand.textColor}
              fontFamily={brand.fontFamily}
            />
          </Sequence>
        );
      })}

      {/* CTA: 25–30s (frames 750–900) */}
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

// ─── Hook Text ───────────────────────────────────────────────────────────────
// Positioned at 22% from top — leaves logo room, anchors to upper third.

const HookText: React.FC<{
  text: string;
  accentColor: string;
  fontFamily: string;
}> = ({ text, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 60 },
  });
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 420,
        paddingLeft: 60,
        paddingRight: 60,
      }}
    >
      {/* Eyebrow label */}
      <div
        style={{
          fontFamily,
          fontWeight: 600,
          fontSize: 36,
          color: accentColor,
          letterSpacing: 6,
          textTransform: "uppercase" as const,
          opacity,
          marginBottom: 24,
        }}
      >
        Did You Know?
      </div>

      {/* Main hook */}
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 88,
          color: "#FFFFFF",
          textAlign: "center",
          lineHeight: 1.15,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {text}
      </div>

      {/* Accent bar */}
      <div
        style={{
          width: 80,
          height: 5,
          borderRadius: 3,
          backgroundColor: accentColor,
          marginTop: 32,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Bullet Point ─────────────────────────────────────────────────────────────
// Each bullet is a full-screen card anchored to the mid zone (paddingTop ~580).
// Large number + text treatment — social-native feel.

const BulletPoint: React.FC<{
  text: string;
  index: number;
  total: number;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ text, index, total, primaryColor, accentColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const x = interpolate(slideIn, [0, 1], [120, 0]);
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out last 10 frames
  const fadeOut = interpolate(frame, [80, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "flex-start",
        paddingTop: 560,
        paddingLeft: 60,
        paddingRight: 60,
        opacity: opacity * fadeOut,
        transform: `translateX(${x}px)`,
      }}
    >
      {/* Step counter */}
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 120,
          color: accentColor,
          lineHeight: 1,
          opacity: 0.18,
          marginBottom: -20,
          marginLeft: -8,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Bullet text */}
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 54,
          color: textColor,
          lineHeight: 1.35,
          maxWidth: 900,
        }}
      >
        {text}
      </div>

      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 48,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 32 : 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: i === index ? accentColor : primaryColor,
              opacity: i === index ? 1 : 0.3,
              transition: "width 0.3s",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
