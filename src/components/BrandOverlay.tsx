import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  spring,
} from "remotion";
import type { BrandKit } from "../utils/brandKit";
import { FONT_FAMILIES } from "../utils/fonts";

interface BrandOverlayProps {
  brandKit: BrandKit;
  showLogo?: boolean;
  showWatermark?: boolean;
}

export const BrandOverlay: React.FC<BrandOverlayProps> = ({
  brandKit,
  showLogo = true,
  showWatermark = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 20], [0, 0.9], {
    extrapolateRight: "clamp",
  });

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });

  return (
    <>
      {/* Logo watermark — top right */}
      {showLogo && brandKit.logo_url && (
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 40,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <Img
            src={brandKit.logo_url}
            style={{
              width: 120,
              height: 120,
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
            }}
          />
        </div>
      )}

      {/* Practice name watermark — top left (subtle) */}
      {showWatermark && !brandKit.logo_url && (
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 40,
            opacity: logoOpacity * 0.7,
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILIES.headline,
              fontWeight: 600,
              fontSize: 24,
              color: brandKit.primary_color,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              letterSpacing: "-0.01em",
            }}
          >
            {brandKit.practice_name}
          </span>
        </div>
      )}

      {/* Top gradient for contrast */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Bottom gradient for caption readability */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 500,
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};
