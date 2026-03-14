import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { z } from "zod";
import { hexToRgba } from "../utils/brandKit";
import { EndCard } from "../components/EndCard";
import { BrandOverlay } from "../components/BrandOverlay";
import { FONT_CSS, FONT_FAMILIES } from "../utils/fonts";
import { BeforeAfterSchema } from "../utils/schemas";

export type BeforeAfterProps = z.infer<typeof BeforeAfterSchema>;

export const BeforeAfter: React.FC<BeforeAfterProps> = ({
  brandKit,
  beforeImageUrl,
  afterImageUrl,
  patientQuote,
  procedureName,
  ctaText,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const ctaDuration = Math.round(3 * fps);
  const ctaStart = durationInFrames - ctaDuration;

  // Phase timings
  const beforePhaseEnd = Math.round(fps * 3); // 3 seconds for "before"
  const revealStart = beforePhaseEnd;
  const revealDuration = Math.round(fps * 1); // 1 second reveal
  const afterPhaseStart = revealStart + revealDuration;

  // Divider animation
  const dividerX = interpolate(
    frame,
    [0, revealStart, revealStart + revealDuration],
    [1080, 1080, 540],
    { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  // Label animations
  const beforeLabelOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  const afterLabelOpacity = interpolate(
    frame,
    [afterPhaseStart, afterPhaseStart + 15],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: brandKit.background_color }}>
      <style>{FONT_CSS}</style>

      {/* Before image — full width initially, then left half */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: dividerX,
          overflow: "hidden",
        }}
      >
        <Img
          src={beforeImageUrl}
          style={{
            width: 1080,
            height: 1920,
            objectFit: "cover",
          }}
        />
        {/* Dark overlay for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.2)",
          }}
        />
        {/* BEFORE label */}
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: beforeLabelOpacity,
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              borderRadius: 12,
              padding: "10px 28px",
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILIES.accent,
                fontWeight: 700,
                fontSize: 28,
                color: "rgba(255,255,255,0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Before
            </span>
          </div>
        </div>
      </div>

      {/* After image — revealed from right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: dividerX,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <Img
          src={afterImageUrl}
          style={{
            width: 1080,
            height: 1920,
            objectFit: "cover",
            marginLeft: -dividerX + 1080,
          }}
        />
        {/* AFTER label */}
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: afterLabelOpacity,
          }}
        >
          <div
            style={{
              background: hexToRgba(brandKit.primary_color, 0.8),
              borderRadius: 12,
              padding: "10px 28px",
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILIES.accent,
                fontWeight: 700,
                fontSize: 28,
                color: brandKit.background_color,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              After
            </span>
          </div>
        </div>
      </div>

      {/* Animated divider line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: dividerX - 2,
          width: 4,
          height: 1920,
          background: `linear-gradient(180deg, ${brandKit.primary_color}, ${brandKit.secondary_color})`,
          boxShadow: `0 0 20px ${hexToRgba(brandKit.primary_color, 0.5)}`,
        }}
      />

      {/* Procedure name */}
      {procedureName && frame > afterPhaseStart && (
        <div
          style={{
            position: "absolute",
            bottom: 500,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(
              frame,
              [afterPhaseStart + 10, afterPhaseStart + 25],
              [0, 1],
              { extrapolateRight: "clamp" }
            ),
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILIES.headline,
              fontWeight: 700,
              fontSize: 48,
              color: brandKit.primary_color,
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            {procedureName}
          </span>
        </div>
      )}

      {/* Patient quote */}
      {patientQuote && frame > afterPhaseStart + 20 && (
        <div
          style={{
            position: "absolute",
            bottom: 350,
            left: 60,
            right: 60,
            opacity: interpolate(
              frame,
              [afterPhaseStart + 20, afterPhaseStart + 35],
              [0, 1],
              { extrapolateRight: "clamp" }
            ),
          }}
        >
          <p
            style={{
              fontFamily: FONT_FAMILIES.body,
              fontWeight: 500,
              fontSize: 32,
              color: "rgba(255,255,255,0.9)",
              textAlign: "center",
              fontStyle: "italic",
              lineHeight: 1.4,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              margin: 0,
            }}
          >
            "{patientQuote}"
          </p>
        </div>
      )}

      <BrandOverlay brandKit={brandKit} />

      {/* End card */}
      <Sequence from={ctaStart} durationInFrames={ctaDuration}>
        <EndCard brandKit={brandKit} ctaOverride={ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};
