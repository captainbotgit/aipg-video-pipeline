import React from "react";
import { Img } from "remotion";

export const Logo: React.FC<{
  logoText?: string;
  logoUrl?: string;
  textColor: string;
  fontFamily: string;
}> = ({ logoText, logoUrl, textColor, fontFamily }) => {
  if (!logoText && !logoUrl) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 40,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
      }}
    >
      {logoUrl ? (
        <Img src={logoUrl} style={{ height: 60, objectFit: "contain" }} />
      ) : (
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 42,
            color: textColor,
            letterSpacing: 2,
          }}
        >
          {logoText}
        </div>
      )}
    </div>
  );
};
