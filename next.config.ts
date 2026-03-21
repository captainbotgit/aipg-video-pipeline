import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude native binary packages from server-side bundling
  // so Node.js loads them directly from node_modules at runtime
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    // GNU compositor — its 'remotion' binary + glibc .so libs are compatible with
    // Vercel. We copy the binary + .so files to /tmp so $ORIGIN RPATH works, then
    // replace its ffmpeg/ffprobe with truly-static builds (no GLIBC_2.35 needed
    // for video decoding via ffmpeg subprocess). See prepareCombinedBinariesDir().
    "@remotion/compositor-linux-x64-gnu",
    // ffmpeg-static is required by fluent-ffmpeg in /api/ffmpeg/process
    "ffmpeg-static",
    "fluent-ffmpeg",
    // ffprobe-static is NOT listed here — we reference it by hardcoded path only.
    //   Listing it causes NFT to trace all 343MB of platform binaries.
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
      // GNU compositor package — remotion binary (patchelf-patched at build time to
      // remove GLIBC_2.35 hypot requirement), its bundled ffmpeg/ffprobe (with
      // libfdk_aac for AAC audio encoding), and all .so shared libraries.
      // $ORIGIN RPATH in the binary resolves .so files from the same directory.
      "./node_modules/@remotion/compositor-linux-x64-gnu/**",
      "./node_modules/@remotion/renderer/**",
      "./node_modules/remotion/**",
      "./node_modules/@remotion/bundler/**",
    ],
    "/api/ffmpeg/process": [
      "./node_modules/ffmpeg-static/**",
      // ffprobe-static is NOT included here — /api/ffmpeg/process does not use ffprobe,
      // and ffprobe-static/** would pull in all 343MB of platform binaries.
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
