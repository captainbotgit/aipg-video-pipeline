import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import type { WordTimestamp, CaptionSegment } from "../utils/captionParser";
import {
  buildCaptionSegments,
  splitIntoLines,
  getActiveWordIndex,
} from "../utils/captionParser";
import { FONT_FAMILIES, CAPTION_STYLE } from "../utils/fonts";
import { hexToRgba } from "../utils/brandKit";

interface AnimatedCaptionProps {
  words: WordTimestamp[];
  primaryColor: string;
  secondaryColor?: string;
  fontSize?: number;
  emphasizedWords?: string[];
}

export const AnimatedCaption: React.FC<AnimatedCaptionProps> = ({
  words,
  primaryColor,
  secondaryColor,
  fontSize = CAPTION_STYLE.fontSize,
  emphasizedWords = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSec = frame / fps;

  const segments = buildCaptionSegments(words);

  // Find active segment
  const activeSegment = segments.find(
    (seg) => currentTimeSec >= seg.startTime && currentTimeSec <= seg.endTime + 0.3
  );

  if (!activeSegment) return null;

  const activeWordIndex = getActiveWordIndex(
    activeSegment.words,
    currentTimeSec
  );
  const lines = splitIntoLines(activeSegment.words);

  // Fade in the segment
  const segmentEntryFrame = Math.round(activeSegment.startTime * fps);
  const segmentOpacity = interpolate(
    frame - segmentEntryFrame,
    [0, 8],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Slide up entrance
  const slideY = interpolate(frame - segmentEntryFrame, [0, 10], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 280,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: segmentOpacity,
        transform: `translateY(${slideY}px)`,
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0) 100%)",
          borderRadius: 16,
          padding: "16px 32px",
          maxWidth: 960,
        }}
      >
        {lines.map((lineWords, lineIdx) => (
          <div
            key={lineIdx}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: lineIdx < lines.length - 1 ? 8 : 0,
            }}
          >
            {lineWords.map((word, wordIdx) => {
              // Calculate global index within segment
              const globalIdx =
                lineIdx === 0
                  ? wordIdx
                  : lines[0].length + wordIdx;

              const isActive = globalIdx === activeWordIndex;
              const isPast = globalIdx < activeWordIndex;
              const isFuture = globalIdx > activeWordIndex;
              const isEmphasized = emphasizedWords.some(
                (ew) =>
                  word.word.toLowerCase().includes(ew.toLowerCase())
              );

              // Spring animation for active word
              const wordEntryFrame = Math.round(word.start * fps);
              const scaleValue = isActive
                ? spring({
                    frame: frame - wordEntryFrame,
                    fps,
                    config: {
                      damping: 12,
                      stiffness: 200,
                      mass: 0.5,
                    },
                  }) *
                    0.1 +
                  1
                : 1;

              let color: string;
              let opacity: number;
              if (isActive) {
                color = primaryColor;
                opacity = 1;
              } else if (isPast) {
                color = "#FFFFFF";
                opacity = 1;
              } else {
                color = "#FFFFFF";
                opacity = 0.5;
              }

              // Emphasized words get secondary color when active
              if (isActive && isEmphasized && secondaryColor) {
                color = secondaryColor;
              }

              return (
                <span
                  key={`${lineIdx}-${wordIdx}`}
                  style={{
                    fontFamily: FONT_FAMILIES.headline,
                    fontWeight: 700,
                    fontSize: isEmphasized && isActive ? fontSize * 1.05 : fontSize,
                    lineHeight: CAPTION_STYLE.lineHeight,
                    letterSpacing: CAPTION_STYLE.letterSpacing,
                    textShadow: CAPTION_STYLE.textShadow,
                    color,
                    opacity,
                    transform: `scale(${scaleValue})`,
                    display: "inline-block",
                    transition: "color 0.1s ease",
                    textTransform: "uppercase",
                  }}
                >
                  {word.word}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
