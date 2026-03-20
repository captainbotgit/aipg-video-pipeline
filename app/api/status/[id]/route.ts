/**
 * GET /api/status/[id]
 *
 * Returns the current status of a render job.
 * Status is persisted as JSON in Vercel Blob at status/{jobId}.json.
 *
 * Response: { jobId, status, progress, videoUrl?, error? }
 */

import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Job ID is required" },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({
      jobId: id,
      status: "unknown",
      message: "Status tracking requires BLOB_READ_WRITE_TOKEN",
    });
  }

  try {
    const { blobs } = await list({ prefix: `status/${id}.json` });

    if (!blobs.length) {
      return NextResponse.json(
        { jobId: id, status: "not_found" },
        { status: 404 }
      );
    }

    // Fetch the JSON content from the blob URL
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { jobId: id, status: "not_found" },
        { status: 404 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { jobId: id, status: "error", error },
      { status: 500 }
    );
  }
}
