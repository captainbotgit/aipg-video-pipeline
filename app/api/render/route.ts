/**
 * POST /api/render
 *
 * Renders a Remotion composition to MP4 using the pre-built public/bundle.
 * Stores the result in Vercel Blob and returns the public URL.
 *
 * Body: { compositionId: string, inputProps: object }
 * Response: { success: boolean, videoUrl: string, url: string, jobId: string }
 *
 * Compatible with existing n8n Layer 3 webhook calls.
 */

import { NextRequest, NextResponse } from "next/server";
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
  // Multi-process Chrome: each renderer process has its own fresh V8 heap, which
  // avoids accumulated GC pressure on long (60 s) DentalExplainer renders.
  // Single-process packs everything into one heap that grows unbounded.
  enableMultiProcessOnLinux: true,
  headless: true,
  chromiumFlags: [
    // Use /tmp instead of /dev/shm (Vercel restricts /dev/shm size)
    "--disable-dev-shm-usage",
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

function getChromiumExecutable(): Promise<string> {
  if (!chromiumExecutablePromise) {
    chromiumExecutablePromise = chromium.executablePath(CHROMIUM_BINARY_URL);
  }
  return chromiumExecutablePromise;
}

// Vercel Fluid Compute — allow up to 5 minutes for renders
export const maxDuration = 300;
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
// Vercel's /tmp is only 512 MB. The Chromium binary alone is ~200 MB once
// extracted, leaving ~300 MB for render artifacts. On warm containers,
// failed renders leave behind temp dirs that accumulate and fill /tmp.
//
// Remotion (and its OffthreadVideo path) writes temp dirs with many different
// prefixes — not just "remotion-" but also unpredictable per-render dirs.
// Prefix-based cleanup therefore misses entries and /tmp fills up.
//
// cleanupTmp() takes the known Chromium executable path so it can preserve
// exactly the Chromium binary dir and wipe everything else in /tmp. This
// gives each render the maximum available free space on warm containers.
//
// Called:
//   • After getChromiumExecutable() resolves (pre-render, inside try block)
//   • After successful upload
//   • In the error catch block

function cleanupTmp(outputPath: string, browserExecutable?: string) {
  // Remove the render output file (may not exist yet on pre-render call)
  try { fs.unlinkSync(outputPath); } catch { /* ignore */ }

  const tmpDir = os.tmpdir();

  // Determine which top-level /tmp entries to preserve.
  // When we know the Chromium path we can preserve exactly its parent dir.
  // Without it we fall back to name-based heuristics.
  const preserveNames = new Set<string>();
  if (browserExecutable) {
    const rel = path.relative(tmpDir, browserExecutable);
    const topLevel = rel.split(path.sep)[0];
    if (topLevel && !topLevel.startsWith("..")) {
      preserveNames.add(topLevel);
    }
    // Chromium tar download artifact
    preserveNames.add("chromium.tar");
    preserveNames.add("chromium-pack.tar");
  }

  try {
    for (const entry of fs.readdirSync(tmpDir)) {
      // Always preserve known Chromium paths (safety net when no execPath given)
      if (
        preserveNames.has(entry) ||
        (!browserExecutable && (
          entry.startsWith("chromium") ||
          entry.startsWith(".local-chromium")
        ))
      ) continue;

      try {
        fs.rmSync(path.join(tmpDir, entry), { recursive: true, force: true });
      } catch { /* ignore individual failures */ }
    }
  } catch { /* ignore */ }
}

// ─── Bundle URL Resolution ────────────────────────────────────────────────────

function getBundleUrl(req: NextRequest): string {
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
  const host = req.headers.get("host") || "localhost:3000";
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

  const bundleUrl = getBundleUrl(req);

  await writeStatus(jobId, {
    jobId,
    compositionId,
    status: "rendering",
    progress: 0,
    startedAt,
  });

  const tmpPath = path.join(os.tmpdir(), `render-${jobId}.mp4`);

  // Hoisted so the catch block can also pass it to cleanupTmp.
  let browserExecutable: string | undefined;

  try {
    // Resolve a Chromium binary that works in the Vercel serverless environment.
    // /tmp is writable (Vercel Fluid Compute); subsequent warm-start invocations
    // will find the binary already extracted there and skip the download.
    // getChromiumExecutable() deduplicates concurrent extraction via a module-level
    // promise so parallel requests don't race to write the same binary (ETXTBSY).
    browserExecutable = await getChromiumExecutable();
    const binariesDirectory = getGnuBinariesDir();

    // Pre-render cleanup — now that we know the Chromium executable path we can
    // do an aggressive sweep: remove EVERYTHING in /tmp except the Chromium binary
    // dir. Previous failed renders may have left dirs with arbitrary prefixes
    // (OffthreadVideo frame caches, audio temp dirs, etc.) that prefix-based
    // cleanup missed. This guarantees maximum free /tmp headroom every render.
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
      // blowing through Vercel's 3 GB RAM cap on long OffthreadVideo compositions.
      concurrency: 1,
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
      startedAt,
      completedAt,
    });

    // Return n8n-compatible response
    return NextResponse.json({
      success: true,
      videoUrl: blob.url,
      url: blob.url, // alias used by some n8n nodes
      jobId,
      compositionId,
      startedAt,
      completedAt,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);

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

    return NextResponse.json(
      { success: false, error, jobId },
      { status: 500 }
    );
  }
}
