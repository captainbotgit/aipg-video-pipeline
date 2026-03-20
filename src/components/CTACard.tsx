import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";

export const CTACard: React.FC<{
  text: string;
  startFrame: number;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}> = ({ text, startFrame, accentColor, textColor, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = frame - startFrame;

  const scale = spring({
    frame: progress,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const opacity = interpolate(progress, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          backgroundColor: accentColor,
          padding: "40px 60px",
          borderRadius: 24,
          maxWidth: 800,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 48,
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
