import { staticFile } from "remotion";

/**
 * Font configuration for premium typography.
 *
 * Clash Display — Headlines (Bold, Semibold) — from Fontshare
 * Inter — Body text (Medium, Semibold) — Google Fonts
 * Satoshi — Accent text (Bold, Black) — from Fontshare
 * General Sans — Fallback (Medium) — from Fontshare
 *
 * Fonts are loaded via CSS @font-face in the Root component.
 * For Render.com deployment, bundle fonts in /public/fonts/.
 * For local dev, Google Fonts CDN works via <link> tags.
 */

export const FONT_FAMILIES = {
  headline: "'Clash Display', 'General Sans', sans-serif",
  body: "'Inter', 'General Sans', sans-serif",
  accent: "'Satoshi', 'General Sans', sans-serif",
  fallback: "'General Sans', sans-serif",
} as const;

export const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@font-face {
  font-family: 'Clash Display';
  src: url('https://cdn.fontshare.com/wf/FWRML6ZCAIORGM7TPKDP2GDPXFHC/ZQPUQAHQCNEGZXYV3HA3MWWH7C3JNNFH/EPJJLK7GBQCNVFPMZJ7YW3C2OFATXUQZ.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Clash Display';
  src: url('https://cdn.fontshare.com/wf/FWRML6ZCAIORGM7TPKDP2GDPXFHC/KN4LFXJ5GOHQ3MDDRZJYRXR2KU3U4P5O/K3QFWKPJG7C6M5SVMOYILFFQHQMZPRLQ.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('https://cdn.fontshare.com/wf/YIHJBPNPO4S3RTDRWUT3SJHGGRQMQFAS/OOPKNHPGFJG5RDQX6VSJFP5LEKJBKZFB/3XO7XYDQISBBCLXBDL3KQFFNQ3WSOGFL.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('https://cdn.fontshare.com/wf/YIHJBPNPO4S3RTDRWUT3SJHGGRQMQFAS/S7IBXD3MGFBKPOH36TCDMIJRBUJT4BRC/DQZFXXJDWTLJGKPXKDQZXE3PKLR5ASRN.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'General Sans';
  src: url('https://cdn.fontshare.com/wf/FWRML6ZCAIORGM7TPKDP2GDPXFHC/SXYWAELUZ5RCA6MPVUHFZQCJZ7RWTTIL/FTNKEMYTBCFSJJ62NAP5HXY37VPHXFIJ.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
`;

export const CAPTION_STYLE = {
  fontSize: 56,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  fontFamily: FONT_FAMILIES.headline,
  fontWeight: 700,
} as const;
