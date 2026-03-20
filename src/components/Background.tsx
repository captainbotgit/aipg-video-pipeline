import React from "react";
import { AbsoluteFill } from "remotion";

export const Background: React.FC<{
  backgroundColor: string;
}> = ({ backgroundColor }) => (
  <AbsoluteFill style={{ backgroundColor }} />
);
