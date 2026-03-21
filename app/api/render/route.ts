/**
 * POST /api/render
 *
 * Async render endpoint. Accepts a compositionId + inputProps, writes an
 * initial "queued" status to Vercel Blob, and returns a jobId immediately.
 * The actual render runs in the background via Next.js 15 `after()` so the
 * HTTP connection is never held open for 10+ minutes.
 *
 * Clients poll  GET /api/status/[jobId]  until status is "done" or "error".
 * When done, the status JSON contains videoUrl pointing at the rendered MP4.
 *
 * Body:   { compositionId: string, inputProps: object, overrideDurationInFrames?: number }
 * Returns: { success: true, jobId: string, compositionId: string, status: "queued", pollUrl: string }
 *
 * n8n Layer 3 compatibility note:
 *   Old synchronous response shape included `videoUrl` and `url`.
 *   New shape returns `jobId` + `pollUrl` — n8n workflows should poll
 *   /api/status/{jobId} and extract videoUrl from the final status.
 */

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs";
import os from "os";
import { randomUUID } from "crypto";
import chromium from "@sparticuz/chromium-min";

// Chromium binary for serverless environments.
// Vercel's function bundle is read-only (/var/task), so Remotion cannot download
// Chrome into node_modules/.remotion. We provide our own binary via @sparticuz/chromium-min
// which downloads to /tmp (writable) on first invocation and caches for warm starts.
const CHROMIUM_BINARY_URL =
  process.env.CHROMIUM_BINARY_URL ||
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";

const CHROMIUM_OPTIONS = {
  disableWebSecurity: true,
  // Single-process Chrome on Linux keeps the RAM footprint minimal.
  // Multi-process spawns separate GPU + zygote + renderer processes — at
  // 1080×1920 with OffthreadVideo this can exceed the 3 GB function limit.
  enableMultiProcessOnLinux: false,
  headless: true,
  chromiumFlags: [
    // Use /tmp instead of /dev/shm (Vercel restricts /dev/shm size)
    "--disable-dev-shm-usage",
    // Disable GPU rendering — renders to software, saves GPU process RAM
    "--disable-gpu",
    // Prevent zygote helper process (multi-process only, but explicit is safe)
    "--no-zygote",
    // Discard cached resources aggressively to free memory during long renders
    "--aggressive-cache-discard",
    // Reduce background timer throttling overhead
    "--disable-background-timer-throttling",
  ],
} as const;

// Module-level promise so concurrent cold-start requests on the same instance
// wait for the first extraction to finish rather than all racing to write the
// Chrome binary simultaneously (which causes "spawn ETXTBSY").
let chromiumExecutablePromise: Promise<string> | null = null;

// ─── Chromium Self-Healing ────────────────────────────────────────────────────
//
// @sparticuz/chromium-min on AL2023/Vercel extracts files into these /tmp dirs:
//   /tmp/chromium          — the Chrome binary (file)
//   /tmp/chromium-pack/    — downloaded tar (dir, starts with "chromium")
//   /tmp/al2023/lib/       — shared libs: libnspr4.so, libnss3.so, libX11.so…
//   /tmp/fonts/            — font config files
//   /tmp/*.so              — swiftshader libs extracted flat into /tmp (files)
//
// setupLambdaEnvironment() sets LD_LIBRARY_PATH=/tmp/al2023/lib at module load
// so Chrome can find libnspr4.so etc. there.
//
// ROOT CAUSE of "libnspr4.so: cannot open shared object file":
//   cleanupTmp() was deleting /tmp/al2023/ (doesn't start with "chromium"),
//   removing the shared libraries Chrome requires on every render.
//
// inflate() (used by executablePath to extract al2023.tar.br) has an early-return:
//   if /tmp/al2023 already EXISTS it skips extraction entirely. So just deleting
//   the chromium binary isn't enough — we must also delete /tmp/al2023/ to force
//   the full re-extraction of the .so files.
//
// FIXES:
//   1. cleanupTmp(): preserve /tmp/al2023/ and /tmp/fonts/ in addition to /tmp/chromium*/
//   2. Sentinel: check /tmp/al2023/lib/libnspr4.so (correct AL2023 path)
//   3. invalidateChromiumCache(): delete both /tmp/chromium AND /tmp/al2023/

// Sentinel path for shared libs on AL2023/Vercel — inside the al2023 extraction dir.
const CHROMIUM_AL2023_DIR = path.join(os.tmpdir(), "al2023");
const CHROMIUM_SENTINEL_SO = path.join(CHROMIUM_AL2023_DIR, "lib", "libnspr4.so");

const CHROME_BROKEN_PATTERNS = [
  "cannot open shared object file",
  "Failed to launch the browser process",
  "spawn chromium ENOENT",
  "No usable sandbox",
  "error while loading shared libraries",
];

function isBrokenChromiumError(message: string): boolean {
  return CHROME_BROKEN_PATTERNS.some((p) => message.includes(p));
}

function invalidateChromiumCache(): void {
  chromiumExecutablePromise = null;
  // Delete the binary so executablePath() re-downloads the pack.
  const binaryPath = path.join(os.tmpdir(), "chromium");
  try { if (fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath); } catch { /* ignore */ }
  // Delete /tmp/al2023/ so inflate() doesn't early-return on existing dir
  // and fully re-extracts the .so files from al2023.tar.br.
  try { if (fs.existsSync(CHROMIUM_AL2023_DIR)) fs.rmSync(CHROMIUM_AL2023_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
  console.log("[render] Invalidated Chromium cache — binary + al2023 dir deleted, will re-extract");
}

async function getChromiumExecutable(): Promise<string> {
  // Unconditional health check: if the Chrome binary exists but the sentinel
  // .so is missing (from /tmp/al2023/lib/), the installation is corrupted.
  // Delete both the binary AND /tmp/al2023/ so executablePath() fully
  // re-extracts the Chromium pack (binary + al2023 .so libs) on THIS request.
  //
  // Must run unconditionally (not gated on chromiumExecutablePromise) —
  // warm containers with a freshly loaded module (promise=null) but stale
  // /tmp need this check just as much as containers with a cached promise.
  const binaryPath = path.join(os.tmpdir(), "chromium");
  const binaryExists = fs.existsSync(binaryPath);
  const sentinelExists = fs.existsSync(CHROMIUM_SENTINEL_SO);

  if (binaryExists && !sentinelExists) {
    console.warn("[render] Corrupted Chromium install — binary present but /tmp/al2023/lib/libnspr4.so missing. Forcing full re-extraction.");
    invalidateChromiumCache();
  } else if (!binaryExists) {
    // Binary absent — reset promise to avoid reusing a stale in-flight one.
    chromiumExecutablePromise = null;
  }

  if (!chromiumExecutablePromise) {
    chromiumExecutablePromise = chromium.executablePath(CHROMIUM_BINARY_URL);
  }
  return chromiumExecutablePromise;
}

// Vercel Fluid Compute — allow up to ~13 minutes for long renders (Pro plan max).
// DentalExplainer at 1800 frames takes ~10-11 min; 300s (5 min) is too short.
export const maxDuration = 800;
export const runtime = "nodejs";

// ─── Compositor Binary Selection ─────────────────────────────────────────────
//
// Problem: Remotion auto-selects @remotion/compositor-linux-x64-gnu on Linux,
// but that binary requires GLIBC_2.35 which is absent from Vercel's runtime
// (Amazon Linux 2023, glibc 2.34).
//
// Solution: During the Vercel BUILD (scripts/patch-compositor.sh), patchelf
// clears the GLIBC_2.35 version requirement for `hypot` in the binary IN PLACE.
// At runtime we simply point Remotion at the GNU package directory — the binary
// is already patched, its bundled ffmpeg/ffprobe (with libfdk_aac) are alongside
// it, and $ORIGIN RPATH resolves the .so libs from the same directory.
//
// On macOS this returns undefined — Remotion picks darwin binaries automatically.

// Cached result — computed once per cold start.
let gnuBinariesDir: string | undefined | null = null;

function getGnuBinariesDir(): string | undefined {
  if (gnuBinariesDir !== null) return gnuBinariesDir;
  if (process.platform !== "linux") {
    gnuBinariesDir = undefined;
    return undefined;
  }

  const candidates = [
    process.env.LAMBDA_TASK_ROOT ?? "/var/task",
    process.cwd(),
  ];

  for (const base of candidates) {
    const dir = path.join(base, "node_modules/@remotion/compositor-linux-x64-gnu");
    try {
      if (fs.existsSync(path.join(dir, "remotion"))) {
        console.log(`[render] GNU compositor found at: ${dir}`);
        gnuBinariesDir = dir;
        return dir;
      }
    } catch { /* ignore */ }
  }

  console.warn("[render] GNU compositor not found — Remotion will use default path");
  gnuBinariesDir = undefined;
  return undefined;
}

// ─── /tmp Cleanup ─────────────────────────────────────────────────────────────
//
// Vercel's /tmp is only 512 MB. /tmp budget breakdown:
//   ~250 MB  /tmp/chromium     — Chrome binary (FILE, never deleted here)
//   ~50  MB  /tmp/al2023/      — shared libs: libnspr4.so, libX11.so… (preserved)
//   ~5   MB  /tmp/fonts/       — font config (preserved)
//   ~207 MB  remaining         — available for render artifacts
//
// IMPORTANT: chromium-pack/ (the downloaded tarball cache, ~100-200 MB) is
// a DIRECTORY that we DELETE during cleanup. It is not needed after the initial
// extraction — the binary (/tmp/chromium) and .so libs (/tmp/al2023/) persist.
// Preserving it was previously causing ENOSPC on renders > ~90 frames.
//
// Remotion writes render artifacts as DIRECTORIES (not loose files):
//   • /tmp/remotion-*       — per-render frame/audio temp dirs
//   • /tmp/puppeteer_dev_*  — Chrome user-data-dir created per render
//   • Plus dirs with unpredictable names from OffthreadVideo caches
//
// Strategy: delete every DIRECTORY in /tmp except al2023/ and fonts/ (and any
// directory containing the Chromium binary, which is uncommon with chromium-min).
// All loose FILES (Chromium binary, .so libs) are left intact.
//
// Called:
//   • After getChromiumExecutable() resolves (pre-render, inside try block)
//   • After successful upload
//   • In the error catch block

function cleanupTmp(outputPath: string, browserExecutable?: string) {
  // Remove the render output file (may not exist yet on pre-render call)
  try { fs.unlinkSync(outputPath); } catch { /* ignore */ }

  const tmpDir = os.tmpdir();

  // Identify Chromium sub-directories to keep (usually none — chromium-min
  // places the binary and .so files directly in /tmp, not in a sub-dir).
  const chromiumDirs = new Set<string>();
  if (browserExecutable) {
    const rel = path.relative(tmpDir, browserExecutable);
    const topLevel = rel.split(path.sep)[0];
    if (topLevel && !topLevel.startsWith("..")) {
      try {
        if (fs.statSync(path.join(tmpDir, topLevel)).isDirectory()) {
          chromiumDirs.add(topLevel);
        }
      } catch { /* ignore */ }
    }
  }

  try {
    for (const entry of fs.readdirSync(tmpDir)) {
      const fullPath = path.join(tmpDir, entry);
      let stat: fs.Stats;
      try { stat = fs.statSync(fullPath); } catch { continue; }

      if (stat.isDirectory()) {
        // Preserve Chromium sub-directories (rare but possible)
        if (chromiumDirs.has(entry)) continue;
        // Preserve AL2023 shared-library dir (/tmp/al2023/lib/libnspr4.so etc.)
        // LD_LIBRARY_PATH=/tmp/al2023/lib is set at module load — Chrome needs these.
        if (entry === "al2023") continue;
        // Preserve font config dir (/tmp/fonts/) extracted by chromium-min.
        if (entry === "fonts") continue;
        // NOTE: We deliberately do NOT preserve "chromium-pack/" or other
        // chromium-* directories. chromium-pack/ is the downloaded tarball cache
        // (~100-200 MB) — after extraction it is no longer needed. The binary
        // (/tmp/chromium) is a FILE not a DIR, so it is never touched here.
        // Keeping chromium-pack/ alongside the ~250 MB binary leaves only ~60 MB
        // for render artifacts, causing ENOSPC on anything longer than ~90 frames.
        //
        // Delete all other dirs: Remotion frame dirs, Chrome profile dirs,
        // chromium-pack tarball cache, etc.
        try { fs.rmSync(fullPath, { recursive: true, force: true }); } catch { /* ignore */ }
      } else {
        // Only delete orphaned render MP4 output files; leave all other
        // files (Chromium's libnspr4.so etc.) untouched.
        if (entry.startsWith("render-") && entry.endsWith(".mp4")) {
          try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
        }
      }
    }
  } catch { /* ignore */ }
}

// ─── Bundle URL Resolution ────────────────────────────────────────────────────

function getBundleUrl(host: string): string {
  // Explicit override (set in Vercel env: RENDER_BUNDLE_URL)
  if (process.env.RENDER_BUNDLE_URL) {
    return process.env.RENDER_BUNDLE_URL;
  }
  // Prefer the stable production URL (VERCEL_PROJECT_PRODUCTION_URL, e.g.
  // "aipg-video-pipeline.vercel.app"). VERCEL_URL is the per-deployment hash URL
  // which may trigger Vercel's authentication wall in Chrome.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/bundle/index.html`;
  }
  // Fallback: per-deployment URL (OK if Deployment Protection is disabled)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/bundle/index.html`;
  }
  // Local dev fallback
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}/bundle/index.html`;
}

// ─── Status Tracking (Vercel Blob) ───────────────────────────────────────────

async function writeStatus(jobId: string, data: Record<string, unknown>) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await put(`status/${jobId}.json`, JSON.stringify(data), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
  } catch {
    // Non-critical — don't fail the render if status write fails
  }
}

// ─── Core Render Logic ────────────────────────────────────────────────────────

async function runRender({
  jobId,
  compositionId,
  inputProps,
  overrideDurationInFrames,
  bundleUrl,
  startedAt,
}: {
  jobId: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
  overrideDurationInFrames?: number;
  bundleUrl: string;
  startedAt: string;
}) {
  const tmpPath = path.join(os.tmpdir(), `render-${jobId}.mp4`);
  let browserExecutable: string | undefined;

  try {
    browserExecutable = await getChromiumExecutable();
    const binariesDirectory = getGnuBinariesDir();

    console.log(`[render] chromium executable: ${browserExecutable}`);

    // Pre-render cleanup — delete Remotion render artifact directories and
    // orphaned output MP4 files. Chromium's extracted files are preserved.
    cleanupTmp(tmpPath, browserExecutable);

    // Select composition (validates compositionId + resolves duration)
    const compositionRaw = await selectComposition({
      serveUrl: bundleUrl,
      id: compositionId,
      inputProps,
      browserExecutable,
      chromiumOptions: CHROMIUM_OPTIONS,
    });

    // Allow callers to cap duration (useful for testing long compositions on
    // memory-constrained infrastructure without changing source code).
    const composition = overrideDurationInFrames
      ? { ...compositionRaw, durationInFrames: overrideDurationInFrames }
      : compositionRaw;

    await writeStatus(jobId, {
      jobId,
      compositionId,
      status: "rendering",
      progress: 0,
      startedAt,
    });

    // Render to /tmp
    await renderMedia({
      composition,
      serveUrl: bundleUrl,
      codec: "h264",
      outputLocation: tmpPath,
      inputProps,
      browserExecutable,
      chromiumOptions: CHROMIUM_OPTIONS,
      // GNU package dir (patchelf-patched at build time) on Linux.
      // undefined on macOS → Remotion uses its darwin binary automatically.
      ...(binariesDirectory ? { binariesDirectory } : {}),
      // Single Chrome tab renders one frame at a time — avoids parallel decoding
      // blowing through Vercel's RAM cap on long OffthreadVideo compositions.
      concurrency: 1,
      // JPEG intermediate frames (vs PNG default) significantly reduce /tmp usage.
      // Vercel /tmp is capped at 512 MB; after Chromium extraction (~305 MB for
      // binary + al2023 libs + fonts) only ~207 MB remains for render artifacts.
      // PNG frames at 1080×1920 are 500 KB–2 MB each → 900 MB–3.6 GB for 1800
      // frames, impossible. JPEG quality 80 → ~100–150 KB each → ~270 MB, still
      // over budget. JPEG quality 30 → ~30–60 KB each → ~54–108 MB, fits easily.
      // Quality 30 is plenty for intermediate frames — the final H.264 pass
      // re-encodes from these, and video-over-video compositions tolerate it well.
      imageFormat: "jpeg",
      jpegQuality: 30,
      // Cap OffthreadVideo frame cache at 100 MB. Without a limit it grows
      // unbounded across 1800 frames of a 60-second video, causing Chrome OOM.
      // Remotion re-fetches evicted frames from the compositor — a small
      // perf trade-off for the ability to complete long renders on limited RAM.
      offthreadVideoCacheSizeInBytes: 100 * 1024 * 1024,
      onProgress: async ({ progress }) => {
        await writeStatus(jobId, {
          jobId,
          compositionId,
          status: "rendering",
          progress: Math.round(progress * 100),
          startedAt,
        });
      },
    });

    // Upload to Vercel Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN is not set. Add it in Vercel environment variables."
      );
    }

    const buffer = fs.readFileSync(tmpPath);
    const blob = await put(
      `renders/${compositionId}-${jobId}.mp4`,
      buffer,
      {
        access: "public",
        contentType: "video/mp4",
        addRandomSuffix: false,
      }
    );

    // Cleanup: wipe /tmp (except Chromium binary) so the next render starts clean.
    cleanupTmp(tmpPath, browserExecutable);

    const completedAt = new Date().toISOString();

    await writeStatus(jobId, {
      jobId,
      compositionId,
      status: "done",
      progress: 100,
      videoUrl: blob.url,
      url: blob.url,
      startedAt,
      completedAt,
    });

    console.log(`[render] done: ${compositionId} → ${blob.url}`);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);

    // Self-heal broken Chromium installations (missing .so files).
    if (isBrokenChromiumError(error)) {
      console.error(`[render] Broken Chromium detected — invalidating cache. Error: ${error}`);
      invalidateChromiumCache();
    }

    // Clean up everything in /tmp (except Chromium) so retries have headroom.
    cleanupTmp(tmpPath, browserExecutable);

    await writeStatus(jobId, {
      jobId,
      compositionId,
      status: "error",
      error,
      startedAt,
      failedAt: new Date().toISOString(),
    });

    console.error(`[render] failed: ${compositionId} — ${error}`);
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const jobId = randomUUID();
  const startedAt = new Date().toISOString();

  let body: {
    compositionId?: string;
    inputProps?: Record<string, unknown>;
    // Optional: cap the render at N frames (for testing long compositions on
    // constrained infrastructure). Not passed to Remotion's composition — only
    // used to override durationInFrames before handing to renderMedia.
    overrideDurationInFrames?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { compositionId, inputProps = {}, overrideDurationInFrames } = body;

  if (!compositionId) {
    return NextResponse.json(
      { success: false, error: "compositionId is required" },
      { status: 400 }
    );
  }

  // Resolve bundle URL from the incoming request host (captures per-deployment URL).
  const host = req.headers.get("host") || "localhost:3000";
  const bundleUrl = getBundleUrl(host);

  // Write initial status so polling clients see "queued" immediately.
  await writeStatus(jobId, {
    jobId,
    compositionId,
    status: "queued",
    progress: 0,
    startedAt,
  });

  // Schedule render to run AFTER the response is sent (Next.js 15 `after()`).
  // This keeps the HTTP connection short — no more 10-minute hanging requests.
  // The function continues running (up to maxDuration=800s) even after the
  // client receives the response, then writes the final status to Vercel Blob.
  after(async () => {
    await runRender({
      jobId,
      compositionId,
      inputProps,
      overrideDurationInFrames,
      bundleUrl,
      startedAt,
    });
  });

  // Return immediately — polling endpoint: GET /api/status/[jobId]
  const origin = req.headers.get("x-forwarded-proto")
    ? `${req.headers.get("x-forwarded-proto")}://${host}`
    : `https://${host}`;

  return NextResponse.json({
    success: true,
    jobId,
    compositionId,
    status: "queued",
    startedAt,
    pollUrl: `${origin}/api/status/${jobId}`,
  });
}
