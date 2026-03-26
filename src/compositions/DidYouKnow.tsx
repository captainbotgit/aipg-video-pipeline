/**
 * DidYouKnow — 1080×1920 portrait
 * Duration: 18s (540 frames @ 30fps)
 *
 * Layout (pixel-precise, vertically centered):
 *   y 0–140    : Logo (top-left, always visible)
 *   y 640–1100 : Hook zone  (frames 0–90)
 *   y 640–1200 : Bullet zone (frames 90–360, one at a time)
 *   bottom 120 : CTA zone   (frames 360–540)
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
      <Background
        backgroundColor={brand.backgroundColor}
        videoUrl={brand.backgroundVideoUrl || undefined}
      />
      <Logo
        logoText={brand.logoText}
        logoUrl={brand.logoUrl}
        textColor={brand.textColor}
        fontFamily={brand.fontFamily}
      />

      {/* ── Hook: 0–3s ─────────────────────────────────────────────── */}
      <Sequence from={0} durationInFrames={90}>
        <HookSection
          text={hookText}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* ── Bullets: 3–12s, one at a time ──────────────────────────── */}
      {bullets.slice(0, 3).map((bullet, i) => (
        <Sequence key={i} from={90 + i * 90} durationInFrames={90}>
          <BulletSection
            text={bullet}
            number={i + 1}
            total={Math.min(bullets.length, 3)}
            primaryColor={brand.primaryColor}
            accentColor={brand.accentColor}
            textColor={brand.textColor}
            fontFamily={brand.fontFamily}
          />
        </Sequence>
      ))}

      {/* ── CTA: 12–18s ────────────────────────────────────────────── */}
      <Sequence from={360} durationInFrames={180}>
        <CTASection
          text={ctaText}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// ─── Hook Section ────────────────────────────────────────────────────────────

const HookSection: React.FC<{
  text: string;
  accentColor: string;
  fontFamily: string;
}> = ({ text, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const y = interpolate(rise, [0, 1], [40, 0]);
  const opacity = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Eyebrow */}
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 60,
          right: 60,
          fontFamily,
          fontWeight: 700,
          fontSize: 38,
          color: accentColor,
          letterSpacing: 8,
          textTransform: "uppercase" as const,
          transform: `translateY(${y}px)`,
        }}
      >
        Did You Know?
      </div>

      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          top: 710,
          left: 60,
          width: 70,
          height: 6,
          borderRadius: 3,
          backgroundColor: accentColor,
          transform: `translateY(${y}px)`,
        }}
      />

      {/* Main headline */}
      <div
        style={{
          position: "absolute",
          top: 760,
          left: 60,
          right: 60,
          fontFamily,
          fontWeight: 900,
          fontSize: 96,
          color: "#FFFFFF",
          lineHeight: 1.1,
          transform: `translateY(${y}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// ─── Bullet Section ───────────────────────────────────────────────────────────

const BulletSection: React.FC<{
  text: string;
  number: number;
  total: number;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ text, number, total, primaryColor, accentColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slide = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const x = interpolate(slide, [0, 1], [80, 0]);
  const opacity = interpolate(frame, [0, 12, 78, 90], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity, transform: `translateX(${x}px)` }}>
      {/* Ghost number — visual depth */}
      <div
        style={{
          position: "absolute",
          top: 620,
          left: 44,
          fontFamily,
          fontWeight: 900,
          fontSize: 260,
          color: accentColor,
          lineHeight: 1,
          opacity: 0.08,
          userSelect: "none" as const,
        }}
      >
        {String(number).padStart(2, "0")}
      </div>

      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          top: 740,
          left: 60,
          width: 60,
          height: 6,
          borderRadius: 3,
          backgroundColor: accentColor,
        }}
      />

      {/* Bullet text */}
      <div
        style={{
          position: "absolute",
          top: 800,
          left: 60,
          right: 60,
          fontFamily,
          fontWeight: 800,
          fontSize: 72,
          color: textColor,
          lineHeight: 1.25,
        }}
      >
        {text}
      </div>

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          top: 1680,
          left: 60,
          display: "flex",
          gap: 14,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === number - 1 ? 40 : 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: i === number - 1 ? accentColor : primaryColor,
              opacity: i === number - 1 ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── CTA Section ─────────────────────────────────────────────────────────────

const CTASection: React.FC<{
  text: string;
  accentColor: string;
  fontFamily: string;
}> = ({ text, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const y = interpolate(rise, [0, 1], [60, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Full-width CTA button pinned to bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 60,
          right: 60,
          backgroundColor: accentColor,
          borderRadius: 28,
          padding: "52px 40px",
          textAlign: "center",
          transform: `translateY(${y}px)`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 52,
            color: "#0A0A0F",
            lineHeight: 1.2,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
