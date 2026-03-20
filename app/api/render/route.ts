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

// Vercel Fluid Compute — allow up to 5 minutes for renders
export const maxDuration = 300;
export const runtime = "nodejs";

// ─── Bundle URL Resolution ────────────────────────────────────────────────────

function getBundleUrl(req: NextRequest): string {
  // Explicit override (set in Vercel env: RENDER_BUNDLE_URL)
  if (process.env.RENDER_BUNDLE_URL) {
    return process.env.RENDER_BUNDLE_URL;
  }
  // Vercel deployment URL (available at runtime).
  // Point to /bundle/index.html explicitly so Next.js static serving
  // returns the file and rewrites handle root-relative /bundle.js, /N.bundle.js etc.
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
    // Select composition (validates compositionId + resolves duration)
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: compositionId,
      inputProps,
    });

    // Render to /tmp
    await renderMedia({
      composition,
      serveUrl: bundleUrl,
      codec: "h264",
      outputLocation: tmpPath,
      inputProps,
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
