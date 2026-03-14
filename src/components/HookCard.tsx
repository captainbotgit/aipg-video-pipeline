import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { FONT_FAMILIES } from "../utils/fonts";
import { hexToRgba } from "../utils/brandKit";

interface HookCardProps {
  text: string;
  primaryColor: string;
  secondaryColor: string;
  durationFrames: number;
  style?: "bold_animated" | "subtle" | "question";
}

export const HookCard: React.FC<HookCardProps> = ({
  text,
  primaryColor,
  secondaryColor,
  durationFrames,
  style = "bold_animated",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Exit animation
  const exitStart = durationFrames - 15;
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (style === "bold_animated") {
    return <BoldAnimatedHook text={text} primaryColor={primaryColor} secondaryColor={secondaryColor} exitOpacity={exitOpacity} />;
  }

  if (style === "question") {
    return <QuestionHook text={text} primaryColor={primaryColor} exitOpacity={exitOpacity} />;
  }

  // Subtle
  return <SubtleHook text={text} primaryColor={primaryColor} exitOpacity={exitOpacity} />;
};

const BoldAnimatedHook: React.FC<{
  text: string;
  primaryColor: string;
  secondaryColor: string;
  exitOpacity: number;
}> = ({ text, primaryColor, secondaryColor, exitOpacity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${hexToRgba(primaryColor, 0.15)} 0%, transparent 70%)`,
        opacity: exitOpacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
          padding: "0 60px",
          maxWidth: 900,
        }}
      >
        {words.map((word, i) => {
          const delay = i * 4;
          const s = spring({
            frame: frame - delay,
            fps,
            config: { damping: 10, stiffness: 180, mass: 0.6 },
          });
          const scale = interpolate(s, [0, 1], [0.3, 1]);
          const opacity = interpolate(s, [0, 1], [0, 1]);
          const y = interpolate(s, [0, 1], [40, 0]);

          return (
            <span
              key={i}
              style={{
                fontFamily: FONT_FAMILIES.headline,
                fontWeight: 700,
                fontSize: 72,
                color: i % 3 === 0 ? primaryColor : "#FFFFFF",
                textShadow: `0 4px 20px ${hexToRgba(primaryColor, 0.4)}`,
                transform: `scale(${scale}) translateY(${y}px)`,
                opacity,
                display: "inline-block",
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const QuestionHook: React.FC<{
  text: string;
  primaryColor: string;
  exitOpacity: number;
}> = ({ text, primaryColor, exitOpacity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.7 },
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: exitOpacity,
      }}
    >
      <div
        style={{
          background: hexToRgba(primaryColor, 0.1),
          border: `3px solid ${hexToRgba(primaryColor, 0.3)}`,
          borderRadius: 24,
          padding: "40px 60px",
          maxWidth: 800,
          transform: `scale(${s})`,
        }}
      >
        <p
          style={{
            fontFamily: FONT_FAMILIES.headline,
            fontWeight: 700,
            fontSize: 58,
            color: "#FFFFFF",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

const SubtleHook: React.FC<{
  text: string;
  primaryColor: string;
  exitOpacity: number;
}> = ({ text, primaryColor, exitOpacity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "35%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: opacity * exitOpacity,
      }}
    >
      <p
        style={{
          fontFamily: FONT_FAMILIES.headline,
          fontWeight: 600,
          fontSize: 52,
          color: primaryColor,
          textAlign: "center",
          padding: "0 60px",
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </p>
    </div>
  );
};
