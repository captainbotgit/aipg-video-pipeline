import express from "express";
import path from "path";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
  getCompositions,
} from "@remotion/renderer";
import fs from "fs";

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3100;
const OUTPUT_DIR = path.join(process.cwd(), "out");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let bundleLocation: string | null = null;

async function ensureBundle(): Promise<string> {
  if (bundleLocation) return bundleLocation;

  console.log("Bundling Remotion project...");
  bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.ts"),
    webpackOverride: (config) => config,
  });
  console.log("Bundle ready at:", bundleLocation);
  return bundleLocation;
}

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    pipeline: "aipg-video-pipeline",
    templates: ["DentalExplainer", "QuickTip", "BeforeAfter", "Testimonial"],
  });
});

// List available compositions
app.get("/compositions", async (_req, res) => {
  try {
    const bundled = await ensureBundle();
    const compositions = await getCompositions(bundled);
    res.json({
      compositions: compositions.map((c) => ({
        id: c.id,
        width: c.width,
        height: c.height,
        fps: c.fps,
        durationInFrames: c.durationInFrames,
      })),
    });
  } catch (err) {
    console.error("Error listing compositions:", err);
    res.status(500).json({ error: "Failed to list compositions" });
  }
});

// Render a single video
app.post("/render", async (req, res) => {
  const {
    compositionId,
    inputProps = {},
    codec = "h264",
    durationInFrames,
    fps = 30,
    outputFormat = "mp4",
  } = req.body;

  if (!compositionId) {
    return res.status(400).json({ error: "compositionId is required" });
  }

  const outputFile = path.join(
    OUTPUT_DIR,
    `${compositionId}-${Date.now()}.${outputFormat === "webm" ? "webm" : "mp4"}`
  );

  try {
    console.log(`Rendering ${compositionId}...`);
    const bundled = await ensureBundle();

    const composition = await selectComposition({
      serveUrl: bundled,
      id: compositionId,
      inputProps,
    });

    // Override duration if provided
    if (durationInFrames) {
      composition.durationInFrames = durationInFrames;
    }
    if (fps) {
      composition.fps = fps;
    }

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: codec as "h264" | "h265" | "vp8" | "vp9",
      outputLocation: outputFile,
      inputProps,
      chromiumOptions: {
        enableMultiProcessOnLinux: true,
      },
    });

    console.log(`Render complete: ${outputFile}`);

    res.json({
      success: true,
      outputFile,
      compositionId,
      size: fs.statSync(outputFile).size,
    });
  } catch (err: any) {
    console.error("Render error:", err);
    res.status(500).json({
      error: "Render failed",
      message: err.message,
    });
  }
});

// Batch render (multiple formats/compositions)
app.post("/render/batch", async (req, res) => {
  const { renders } = req.body;

  if (!Array.isArray(renders) || renders.length === 0) {
    return res
      .status(400)
      .json({ error: "renders must be a non-empty array" });
  }

  const results: Array<{
    compositionId: string;
    success: boolean;
    outputFile?: string;
    error?: string;
  }> = [];

  const bundled = await ensureBundle();

  for (const renderReq of renders) {
    const {
      compositionId,
      inputProps = {},
      codec = "h264",
      durationInFrames,
      outputFormat = "mp4",
    } = renderReq;

    const outputFile = path.join(
      OUTPUT_DIR,
      `${compositionId}-${Date.now()}.${outputFormat === "webm" ? "webm" : "mp4"}`
    );

    try {
      const composition = await selectComposition({
        serveUrl: bundled,
        id: compositionId,
        inputProps,
      });

      if (durationInFrames) {
        composition.durationInFrames = durationInFrames;
      }

      await renderMedia({
        composition,
        serveUrl: bundled,
        codec: codec as "h264" | "h265" | "vp8" | "vp9",
        outputLocation: outputFile,
        inputProps,
      });

      results.push({ compositionId, success: true, outputFile });
    } catch (err: any) {
      results.push({
        compositionId,
        success: false,
        error: err.message,
      });
    }
  }

  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`🎬 AIPG Video Pipeline API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Compositions: http://localhost:${PORT}/compositions`);
  console.log(`   Render: POST http://localhost:${PORT}/render`);
});
