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
  disableWebSecurity: false,
  enableMultiProcessOnLinux: true,
  headless: true,
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
// but that binary requires GLIBC_2.35 which is absent from Vercel's runtime.
// The MUSL package's ffmpeg/ffprobe also fail (need /lib/ld-musl-x86_64.so.1).
//
// Solution: Assemble a /tmp directory with:
//   • remotion  — MUSL package (pure-static Rust binary, no dynamic linker)
//   • ffmpeg    — ffmpeg-static package (truly static, no GLIBC/MUSL needed)
//   • ffprobe   — ffprobe-static package (same)
//
// All three are static; no shared library or dynamic linker required.
// The dir is built once per cold start; warm requests skip it.
// On macOS this returns undefined — Remotion picks darwin binaries itself.

const COMBINED_BIN_DIR = path.join(os.tmpdir(), "remotion-bin-mix");

function findPkgBinary(candidates: string[]): string | null {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch { /* ignore */ }
  }
  return null;
}

async function prepareCombinedBinariesDir(): Promise<string | undefined> {
  if (process.platform !== "linux") return undefined;

  // Warm start: already assembled.
  if (fs.existsSync(path.join(COMBINED_BIN_DIR, "remotion"))) {
    return COMBINED_BIN_DIR;
  }

  const taskRoot = process.env.LAMBDA_TASK_ROOT ?? "/var/task";
  const cwd = process.cwd();

  // Patched remotion binary committed to bin/ — GNU build with GLIBC_2.35 downgraded
  // to GLIBC_2.17 for the single `hypot` symbol. Vercel has glibc 2.34 (AL2023).
  // Committed directly so it's always present regardless of npm platform checks.
  const patchedBinary = findPkgBinary([
    path.join(taskRoot, "bin/remotion-linux-x64"),
    path.join(cwd,      "bin/remotion-linux-x64"),
  ]);

  // GNU compositor .so libs (libavcodec.so etc.) — needed because the binary's
  // $ORIGIN RPATH resolves to the directory it runs from. We copy them to /tmp
  // so they're found alongside our binary copy.
  const gnuPkgDir = [
    path.join(taskRoot, "node_modules/@remotion/compositor-linux-x64-gnu"),
    path.join(cwd,      "node_modules/@remotion/compositor-linux-x64-gnu"),
  ].find(d => { try { return fs.existsSync(path.join(d, "remotion")); } catch { return false; } });

  if (!patchedBinary) {
    console.warn("[render] Patched remotion binary not found — falling back to default");
    return undefined;
  }
  if (!gnuPkgDir) {
    console.warn("[render] GNU compositor package not found — falling back to default");
    return undefined;
  }

  fs.mkdirSync(COMBINED_BIN_DIR, { recursive: true });

  // Copy patched remotion binary to /tmp.
  // (GNU build with GLIBC_2.35 hypot requirement patched to GLIBC_2.17)
  fs.copyFileSync(patchedBinary, path.join(COMBINED_BIN_DIR, "remotion"));
  fs.chmodSync(path.join(COMBINED_BIN_DIR, "remotion"), 0o755);

  // Copy the GNU compositor's entire set of binaries + .so libs.
  // We use the PACKAGE'S ffmpeg/ffprobe (not ffmpeg-static) because they are
  // built by Remotion with libfdk_aac support — required for AAC audio encoding.
  // ffmpeg-static lacks libfdk_aac and breaks audio for all compositions.
  for (const entry of fs.readdirSync(gnuPkgDir)) {
    if (entry === "ffmpeg" || entry === "ffprobe" || entry.endsWith(".so")) {
      const src = path.join(gnuPkgDir, entry);
      const dst = path.join(COMBINED_BIN_DIR, entry);
      fs.copyFileSync(src, dst);
      fs.chmodSync(dst, 0o755);
    }
  }

  return COMBINED_BIN_DIR;
}

// Module-level promise — deduplicates concurrent cold-start preparations.
let combinedBinDirPromise: Promise<string | undefined> | null = null;

function getCombinedBinariesDir(): Promise<string | undefined> {
  if (!combinedBinDirPromise) {
    combinedBinDirPromise = prepareCombinedBinariesDir();
  }
  return combinedBinDirPromise;
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

  let body: { compositionId?: string; inputProps?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { compositionId, inputProps = {} } = body;

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

  try {
    // Resolve a Chromium binary that works in the Vercel serverless environment.
    // /tmp is writable (Vercel Fluid Compute); subsequent warm-start invocations
    // will find the binary already extracted there and skip the download.
    // getChromiumExecutable() deduplicates concurrent extraction via a module-level
    // promise so parallel requests don't race to write the same binary (ETXTBSY).
    const [browserExecutable, binariesDirectory] = await Promise.all([
      getChromiumExecutable(),
      getCombinedBinariesDir(),
    ]);

    // Select composition (validates compositionId + resolves duration)
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: compositionId,
      inputProps,
      browserExecutable,
      chromiumOptions: CHROMIUM_OPTIONS,
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
      // Combined bin dir: MUSL compositor + GNU ffmpeg/ffprobe.
      // undefined on macOS → Remotion uses its darwin binary automatically.
      ...(binariesDirectory ? { binariesDirectory } : {}),
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

    // Cleanup temp
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }

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

    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }

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
