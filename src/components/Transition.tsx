import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

type TransitionType = "crossfade" | "zoom_reveal" | "slide_blur" | "fade" | "cut";

interface TransitionProps {
  type: TransitionType;
  durationFrames?: number;
  children: React.ReactNode;
  direction?: "in" | "out";
}

export const Transition: React.FC<TransitionProps> = ({
  type,
  durationFrames = 9, // ~300ms at 30fps
  children,
  direction = "in",
}) => {
  const frame = useCurrentFrame();

  if (type === "cut") {
    return <>{children}</>;
  }

  const progress =
    direction === "in"
      ? interpolate(frame, [0, durationFrames], [0, 1], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : interpolate(frame, [0, durationFrames], [1, 0], {
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  const style = getTransitionStyle(type, progress);

  return <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
};

function getTransitionStyle(
  type: TransitionType,
  progress: number
): React.CSSProperties {
  switch (type) {
    case "crossfade":
      return { opacity: progress };

    case "zoom_reveal":
      return {
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [1.15, 1])})`,
      };

    case "slide_blur":
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [60, 0])}px)`,
        filter: `blur(${interpolate(progress, [0, 1], [8, 0])}px)`,
      };

    case "fade":
      return { opacity: progress };

    default:
      return { opacity: progress };
  }
}

/**
 * Wraps content with both in and out transitions.
 */
interface SceneTransitionProps {
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
  transitionDuration?: number;
  totalDuration: number;
  children: React.ReactNode;
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  transitionIn = "crossfade",
  transitionOut,
  transitionDuration = 9,
  totalDuration,
  children,
}) => {
  const frame = useCurrentFrame();

  // Entrance
  const entranceProgress =
    transitionIn === "cut"
      ? 1
      : interpolate(frame, [0, transitionDuration], [0, 1], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });

  // Exit
  const exitStart = totalDuration - transitionDuration;
  const exitProgress = transitionOut
    ? transitionOut === "cut"
      ? 1
      : interpolate(frame, [exitStart, totalDuration], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        })
    : 1;

  const combinedProgress = Math.min(entranceProgress, exitProgress);
  const inStyle = getTransitionStyle(transitionIn, combinedProgress);

  return (
    <div style={{ position: "absolute", inset: 0, ...inStyle }}>
      {children}
    </div>
  );
};
