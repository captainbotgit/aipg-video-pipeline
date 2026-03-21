/**
 * GET /api/status/[jobId]
 *
 * Poll the status of an async render job. Jobs are tracked via Vercel Blob
 * at status/{jobId}.json (written by the /api/render background worker).
 *
 * Status lifecycle:
 *   queued    — job accepted, render has not started yet
 *   rendering — render in progress (progress 0–99)
 *   done      — render complete, videoUrl available
 *   error     — render failed, error message available
 *
 * Response shape:
 *   { jobId, compositionId, status, progress, startedAt, ... }
 *   When done:  { ..., videoUrl, url, completedAt }
 *   When error: { ..., error, failedAt }
 *
 * n8n pattern:
 *   1. POST /api/render → { jobId, pollUrl }
 *   2. GET  /api/status/{jobId} every 10–15s until status === "done" | "error"
 *   3. Extract videoUrl from the done response
 */

import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const runtime = "nodejs";
// Status checks are fast — 30s is plenty.
export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json(
      { success: false, error: "jobId is required" },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { success: false, error: "BLOB_READ_WRITE_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    // Find the status blob by prefix — list is reliable even if the blob
    // URL changes (e.g., across Blob store migrations).
    const { blobs } = await list({ prefix: `status/${jobId}.json` });

    if (blobs.length === 0) {
      return NextResponse.json(
        { success: false, error: "Job not found", jobId },
        { status: 404 }
      );
    }

    // Fetch the status JSON from its public Blob URL.
    const blobUrl = blobs[0].url;
    const resp = await fetch(blobUrl, { cache: "no-store" });

    if (!resp.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to read job status from Blob", jobId },
        { status: 500 }
      );
    }

    const status = await resp.json();
    return NextResponse.json({ success: true, ...status });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error, jobId },
      { status: 500 }
    );
  }
}
