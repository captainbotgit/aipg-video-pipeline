import React from "react";
import { AbsoluteFill, Video } from "remotion";

/**
 * Background component — supports solid color or looping video background.
 *
 * Usage:
 *   <Background backgroundColor="#0A0A0F" />                     → solid dark
 *   <Background backgroundColor="#0A0A0F" videoUrl="https://..." /> → video loop + dark overlay
 *
 * The video is always darkened by overlayOpacity (default 0.55) so text
 * stays readable on top regardless of the video content.
 */
export const Background: React.FC<{
  backgroundColor: string;
  videoUrl?: string;
  overlayOpacity?: number;
}> = ({ backgroundColor, videoUrl, overlayOpacity = 0.55 }) => {
  if (videoUrl) {
    return (
      <AbsoluteFill style={{ backgroundColor }}>
        {/* Looping background video — muted, covers frame */}
        <Video
          src={videoUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          muted
          loop
        />
        {/* Dark overlay so text reads clearly */}
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
          }}
        />
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill style={{ backgroundColor }} />;
};
