import { NextResponse } from "next/server";

// Diagnostic endpoint — shows which env vars are present (never exposes values)
export async function GET() {
  const vars = {
    HEYGEN_API_KEY: !!process.env.HEYGEN_API_KEY,
    ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
    AIPG_AVATAR_SUPABASE_URL: !!process.env.AIPG_AVATAR_SUPABASE_URL,
    AIPG_AVATAR_SERVICE_KEY: !!process.env.AIPG_AVATAR_SERVICE_KEY,
  };

  const allPresent = Object.values(vars).every(Boolean);

  return NextResponse.json({
    status: allPresent ? "ok" : "missing_vars",
    vars,
  });
}
