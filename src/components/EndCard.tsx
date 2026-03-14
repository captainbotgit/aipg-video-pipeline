import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
} from "remotion";
import type { BrandKit } from "../utils/brandKit";
import { hexToRgba } from "../utils/brandKit";
import { FONT_FAMILIES } from "../utils/fonts";

interface EndCardProps {
  brandKit: BrandKit;
  ctaOverride?: string;
}

export const EndCard: React.FC<EndCardProps> = ({
  brandKit,
  ctaOverride,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaText = ctaOverride || brandKit.cta_text;

  // Entrance animations
  const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const logoScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.6 },
  });

  const titleY = spring({
    frame: frame - 12,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.7 },
  });

  const buttonScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.5 },
  });

  // Subtle pulse on button
  const pulse =
    1 +
    Math.sin((frame - 30) * 0.08) * 0.03 * (frame > 30 ? 1 : 0);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${hexToRgba(brandKit.primary_color, 0.2)} 0%, ${brandKit.background_color} 70%)`,
        opacity: bgOpacity,
      }}
    >
      {/* Logo */}
      {brandKit.logo_url && (
        <div style={{ transform: `scale(${logoScale})`, marginBottom: 40 }}>
          <Img
            src={brandKit.logo_url}
            style={{
              width: 180,
              height: 180,
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {/* Practice Name */}
      <h1
        style={{
          fontFamily: FONT_FAMILIES.headline,
          fontWeight: 700,
          fontSize: 56,
          color: "#FFFFFF",
          textAlign: "center",
          margin: 0,
          marginBottom: 20,
          letterSpacing: "-0.03em",
          transform: `translateY(${interpolate(titleY, [0, 1], [30, 0])}px)`,
          opacity: titleY,
        }}
      >
        {brandKit.practice_name}
      </h1>

      {/* Divider line */}
      <div
        style={{
          width: interpolate(titleY, [0, 1], [0, 200]),
          height: 3,
          background: `linear-gradient(90deg, transparent, ${brandKit.primary_color}, transparent)`,
          marginBottom: 48,
        }}
      />

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${buttonScale * pulse})`,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${brandKit.primary_color}, ${brandKit.secondary_color})`,
            borderRadius: 60,
            padding: "24px 64px",
            boxShadow: `0 8px 32px ${hexToRgba(brandKit.primary_color, 0.4)}, 0 0 60px ${hexToRgba(brandKit.primary_color, 0.15)}`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILIES.headline,
              fontWeight: 700,
              fontSize: 36,
              color: brandKit.background_color,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {ctaText}
          </span>
        </div>
      </div>

      {/* URL hint */}
      {brandKit.cta_url && (
        <p
          style={{
            fontFamily: FONT_FAMILIES.body,
            fontWeight: 500,
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            marginTop: 24,
            opacity: buttonScale,
          }}
        >
          {brandKit.cta_url.replace(/^https?:\/\//, "")}
        </p>
      )}
    </div>
  );
};
