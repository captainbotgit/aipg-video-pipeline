/**
 * POST /api/ffmpeg/process
 *
 * Replaces the Render.com aipg-ffmpeg-service.
 * Supports: trim, merge, burn-captions operations.
 *
 * Body: { operation: "trim" | "merge" | "burn-captions", ...params }
 * Response: { success: boolean, url: string, jobId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs";
import os from "os";
import { randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

export const maxDuration = 300;
export const runtime = "nodejs";

// Set static ffmpeg binary path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function downloadToTmp(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url} — ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buf));
}

async function uploadToBlob(filePath: string, blobKey: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  const buf = fs.readFileSync(filePath);
  const { url } = await put(blobKey, buf, {
    access: "public",
    contentType: "video/mp4",
    addRandomSuffix: false,
  });
  return url;
}

function cleanup(...paths: string[]) {
  for (const p of paths) {
    try {
      fs.unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
}

function runFfmpeg(cmd: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    cmd.on("end", () => resolve()).on("error", reject).run();
  });
}

// ─── Operations ───────────────────────────────────────────────────────────────

async function trim(
  jobId: string,
  params: {
    inputUrl: string;
    startTime?: number;
    duration?: number;
  }
): Promise<string> {
  const { inputUrl, startTime = 0, duration } = params;
  const tmp = os.tmpdir();
  const inputPath = path.join(tmp, `input-${jobId}.mp4`);
  const outputPath = path.join(tmp, `trim-${jobId}.mp4`);

  await downloadToTmp(inputUrl, inputPath);

  const cmd = ffmpeg(inputPath).setStartTime(startTime);
  if (duration !== undefined) cmd.setDuration(duration);
  cmd.videoCodec("copy").audioCodec("copy").output(outputPath);

  await runFfmpeg(cmd);
  cleanup(inputPath);

  const url = await uploadToBlob(outputPath, `ffmpeg/trim-${jobId}.mp4`);
  cleanup(outputPath);
  return url;
}

async function merge(
  jobId: string,
  params: { inputUrls: string[] }
): Promise<string> {
  const { inputUrls } = params;
  if (!inputUrls?.length) throw new Error("inputUrls array is required");

  const tmp = os.tmpdir();
  const inputPaths: string[] = [];

  for (let i = 0; i < inputUrls.length; i++) {
    const p = path.join(tmp, `input-${jobId}-${i}.mp4`);
    await downloadToTmp(inputUrls[i], p);
    inputPaths.push(p);
  }

  const outputPath = path.join(tmp, `merge-${jobId}.mp4`);
  const cmd = ffmpeg();
  for (const p of inputPaths) cmd.input(p);

  await new Promise<void>((resolve, reject) => {
    cmd
      .on("end", () => resolve())
      .on("error", reject)
      .mergeToFile(outputPath, tmp);
  });

  cleanup(...inputPaths);
  const url = await uploadToBlob(outputPath, `ffmpeg/merge-${jobId}.mp4`);
  cleanup(outputPath);
  return url;
}

async function burnCaptions(
  jobId: string,
  params: {
    inputUrl: string;
    srtUrl?: string;
    srtContent?: string;
  }
): Promise<string> {
  const { inputUrl, srtUrl, srtContent } = params;
  if (!srtUrl && !srtContent) {
    throw new Error("srtUrl or srtContent is required");
  }

  const tmp = os.tmpdir();
  const inputPath = path.join(tmp, `input-${jobId}.mp4`);
  const srtPath = path.join(tmp, `captions-${jobId}.srt`);
  const outputPath = path.join(tmp, `captioned-${jobId}.mp4`);

  await downloadToTmp(inputUrl, inputPath);

  if (srtContent) {
    fs.writeFileSync(srtPath, srtContent, "utf-8");
  } else {
    await downloadToTmp(srtUrl!, srtPath);
  }

  // Escape path for ffmpeg filter
  const escapedSrtPath = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");

  const cmd = ffmpeg(inputPath)
    .videoFilters(`subtitles='${escapedSrtPath}'`)
    .output(outputPath);

  await runFfmpeg(cmd);
  cleanup(inputPath, srtPath);

  const url = await uploadToBlob(outputPath, `ffmpeg/captioned-${jobId}.mp4`);
  cleanup(outputPath);
  return url;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const jobId = randomUUID();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { operation } = body;

  if (!operation) {
    return NextResponse.json(
      { success: false, error: "operation is required (trim | merge | burn-captions)" },
      { status: 400 }
    );
  }

  try {
    let url: string;

    switch (operation) {
      case "trim":
        if (!body.inputUrl) {
          return NextResponse.json(
            { success: false, error: "inputUrl is required for trim" },
            { status: 400 }
          );
        }
        url = await trim(jobId, {
          inputUrl: body.inputUrl as string,
          startTime: body.startTime as number | undefined,
          duration: body.duration as number | undefined,
        });
        break;

      case "merge":
        if (!Array.isArray(body.inputUrls) || body.inputUrls.length === 0) {
          return NextResponse.json(
            { success: false, error: "inputUrls array is required for merge" },
            { status: 400 }
          );
        }
        url = await merge(jobId, { inputUrls: body.inputUrls as string[] });
        break;

      case "burn-captions":
        if (!body.inputUrl) {
          return NextResponse.json(
            { success: false, error: "inputUrl is required for burn-captions" },
            { status: 400 }
          );
        }
        url = await burnCaptions(jobId, {
          inputUrl: body.inputUrl as string,
          srtUrl: body.srtUrl as string | undefined,
          srtContent: body.srtContent as string | undefined,
        });
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown operation "${operation}". Valid: trim | merge | burn-captions`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, url, jobId, operation });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error, jobId },
      { status: 500 }
    );
  }
}
