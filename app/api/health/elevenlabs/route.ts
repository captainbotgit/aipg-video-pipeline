import { NextResponse } from "next/server";

// Test ElevenLabs API key and IVC access
export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "No ELEVENLABS_API_KEY" }, { status: 500 });

  // Test 1: basic auth
  const voicesRes = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });
  const voicesBody = await voicesRes.json().catch(() => ({}));

  // Test 2: check subscription for IVC access
  const subRes = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
    headers: { "xi-api-key": key },
  });
  const subBody = await subRes.json().catch(() => ({}));

  return NextResponse.json({
    voices_status: voicesRes.status,
    voices_ok: voicesRes.ok,
    voice_count: voicesBody?.voices?.length ?? "n/a",
    subscription_status: subRes.status,
    subscription_tier: subBody?.tier ?? "n/a",
    can_use_ivc: subBody?.can_use_instant_voice_cloning ?? "n/a",
    character_limit: subBody?.character_limit ?? "n/a",
  });
}
