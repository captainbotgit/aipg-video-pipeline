import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude native binary packages from server-side bundling
  // so Node.js loads them directly from node_modules at runtime
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    "@remotion/compositor-linux-x64-musl",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-darwin-x64",
    // ffmpeg-static is required by fluent-ffmpeg in /api/ffmpeg/process
    "ffmpeg-static",
    "fluent-ffmpeg",
    // ffprobe-static is NOT listed here — we reference it by hardcoded path only.
    // Listing it as serverExternal causes NFT to trace all 343MB of platform binaries.
  ],
  experimental: {
    serverMinification: false,
  },
  // Force NFT to include Remotion's platform-specific compositor binaries.
  // Remotion loads them dynamically at runtime via a platform detection
  // require() that NFT cannot statically trace.
  // Note: In Next.js 15.5+ this moved from experimental.outputFileTracingIncludes
  // to a top-level outputFileTracingIncludes key.
  outputFileTracingIncludes: {
    "/api/render": [
      // Only the MUSL compositor binary — we copy it to /tmp at cold start.
      // The full GNU package is excluded; its .so files bloat the bundle.
      "./node_modules/@remotion/compositor-linux-x64-musl/remotion",
      "./node_modules/@remotion/renderer/**",
      "./node_modules/remotion/**",
      "./node_modules/@remotion/bundler/**",
      // Static ffmpeg/ffprobe — no shared-library dependencies
      "./node_modules/ffmpeg-static/ffmpeg",
      "./node_modules/ffprobe-static/bin/linux/x64/ffprobe",
    ],
    "/api/ffmpeg/process": [
      "./node_modules/ffmpeg-static/**",
      "./node_modules/ffprobe-static/**",
      "./node_modules/fluent-ffmpeg/**",
    ],
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
