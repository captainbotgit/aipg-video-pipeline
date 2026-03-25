/**
 * DidYouKnow composition — migrated from aipg-video-templates
 * Adapted to use BrandKit (pipeline schema) instead of flat BrandProps.
 *
 * Duration: 30s (900 frames @ 30fps)
 * Sections: Hook (3s) → Bullets (9s) → Voiceover slot (13s) → CTA (5s)
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
      <Background backgroundColor={brand.backgroundColor} />
      <Logo
        logoText={brand.logoText}
        logoUrl={brand.logoUrl}
        textColor={brand.textColor}
        fontFamily={brand.fontFamily}
      />

      {/* Hook text: 0-3s (frames 0-90) */}
      <Sequence from={0} durationInFrames={90}>
        <HookText
          text={hookText}
          accentColor={brand.accentColor}
          fontFamily={brand.fontFamily}
        />
      </Sequence>

      {/* Bullets: 3-12s (frames 90-360), one at a time — 3s each, no overlap */}
      {bullets.slice(0, 3).map((bullet, i) => {
        const bulletStart = 90 + i * 90;
        return (
          <Sequence key={i} from={bulletStart} durationInFrames={90}>
            <BulletPoint
              text={bullet}
              index={i}
              primaryColor={brand.primaryColor}
              textColor={brand.textColor}
              fontFamily={brand.fontFamily}
            />
          </Sequence>
        );
      })}

      {/* Voiceover slot: 12-25s (frames 360-750) */}
      <Sequence from={360} durationInFrames={390}>
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: 120,
          }}
        >
          <VoiceoverIndicator
            accentColor={brand.accentColor}
            fontFamily={brand.fontFamily}
          />
        </AbsoluteFill>
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

const HookText: React.FC<{
  text: string;
  accentColor: string;
  fontFamily: string;
}> = ({ text, accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hookScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 60 },
  });
  const hookOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 96,
          color: accentColor,
          transform: `scale(${hookScale})`,
          opacity: hookOpacity,
          textAlign: "center",
          padding: "0 60px",
          lineHeight: 1.2,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const BulletPoint: React.FC<{
  text: string;
  index: number;
  primaryColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ text, index, primaryColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const x = interpolate(slideIn, [0, 1], [600, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 80,
        paddingRight: 80,
      }}
    >
      <div
        style={{
          transform: `translateX(${x}px)`,
          opacity,
          display: "flex",
          alignItems: "flex-start",
          gap: 24,
          width: "100%",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: primaryColor,
            marginTop: 20,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontFamily,
            fontWeight: 600,
            fontSize: 48,
            color: textColor,
            lineHeight: 1.4,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const VoiceoverIndicator: React.FC<{
  accentColor: string;
  fontFamily: string;
}> = ({ accentColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: pulse,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: accentColor,
        }}
      />
      <div
        style={{
          fontFamily,
          fontSize: 24,
          color: "#9CA3AF",
          fontStyle: "italic",
        }}
      >
        Voiceover audio plays here
      </div>
    </div>
  );
};
