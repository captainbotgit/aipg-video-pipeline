import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude native binary packages from server-side bundling
  // so Node.js loads them directly from node_modules at runtime
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    "@remotion/compositor-linux-x64",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-darwin-x64",
    "ffmpeg-static",
    "fluent-ffmpeg",
  ],
  // Allow large API responses (video files streamed via Vercel Blob)
  experimental: {
    serverMinification: false,
  },
  /**
   * Remotion bundle assets: the bundle is at /public/bundle/ but index.html
   * references its scripts with root-relative paths like /bundle.js.
   * These rewrites proxy root-relative bundle asset requests to /bundle/...
   * so Chromium can load the bundle when serveUrl = "https://host/bundle/index.html".
   */
  async rewrites() {
    return [
      // Main bundle entry
      { source: "/bundle.js", destination: "/bundle/bundle.js" },
      { source: "/bundle.js.map", destination: "/bundle/bundle.js.map" },
      // Webpack chunk files (numbered, e.g. /208.bundle.js)
      {
        source: "/:chunk(\\d+\\.bundle\\.js)",
        destination: "/bundle/:chunk",
      },
      {
        source: "/:chunk(\\d+\\.bundle\\.js\\.map)",
        destination: "/bundle/:chunk",
      },
      // WASM source-map helper
      {
        source: "/source-map-helper.wasm",
        destination: "/bundle/source-map-helper.wasm",
      },
    ];
  },
};

export default nextConfig;
