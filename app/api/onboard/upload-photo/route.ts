import { NextRequest, NextResponse } from "next/server";

// Upload a single photo to HeyGen asset storage
// Returns: { assetId: string }
export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }
    const photo = formData.get("photo") as File | null;

    if (!photo) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    const HEYGEN_KEY = process.env.HEYGEN_API_KEY;
    if (!HEYGEN_KEY) {
      return NextResponse.json({ error: "Missing HEYGEN_API_KEY" }, { status: 500 });
    }

    // Upload to HeyGen asset storage
    const photoBytes = await photo.arrayBuffer();
    const uploadRes = await fetch("https://upload.heygen.com/v1/asset", {
      method: "POST",
      headers: {
        "X-Api-Key": HEYGEN_KEY,
        "Content-Type": photo.type || "image/jpeg",
      },
      body: photoBytes,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("HeyGen photo upload error:", err);
      return NextResponse.json({ error: "HeyGen upload failed", details: err }, { status: 502 });
    }

    const result = await uploadRes.json();
    // HeyGen returns { data: { id, url } }
    const assetId = result?.data?.id || result?.data?.url?.split("/").at(-2);

    if (!assetId) {
      return NextResponse.json({ error: "No asset ID returned", raw: result }, { status: 502 });
    }

    return NextResponse.json({ assetId, url: result?.data?.url });
  } catch (err) {
    console.error("upload-photo error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
