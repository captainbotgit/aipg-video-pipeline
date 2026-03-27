import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Main onboarding submission handler
// 1. Stores practice profile in AIPG Avatar Automation Supabase (separate from DentalCMO)
// 2. Triggers n8n avatar training workflow (HeyGen photo avatar + polling)
// Returns: { practiceId: string, workflowExecutionId: string }

const AIPG_AVATAR_SUPABASE_URL = "https://eveauwkefwjtjbayhmbe.supabase.co";
const N8N_ONBOARD_WEBHOOK = "https://allinengine.app.n8n.cloud/webhook/avatar-onboard";

interface PracticeProfile {
  practiceName: string;
  doctorName: string;
  city: string;
  state: string;
  specialty: string;
  services: string[];
  primaryCTA: string;
  customCTA: string;
  brandVoice: string;
  targetPatient: string;
  avgCaseValue: string;
  monthlyGoal: string;
  uniqueValue: string;
}

interface OnboardPayload {
  profile: PracticeProfile;
  photoAssetIds: string[];       // HeyGen asset IDs (already uploaded)
  elevenlabsVoiceId: string | null;
  consentGiven: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: OnboardPayload = await req.json();
    const { profile, photoAssetIds, elevenlabsVoiceId } = body;

    if (!profile.practiceName || !profile.doctorName) {
      return NextResponse.json({ error: "Missing required practice fields" }, { status: 400 });
    }

    // 1. Upsert practice into DentalCMO Supabase
    const supabaseKey = process.env.AIPG_AVATAR_SERVICE_KEY;
    if (!supabaseKey) {
      return NextResponse.json({ error: "Missing AIPG_AVATAR_SERVICE_KEY" }, { status: 500 });
    }

    const supabase = createClient(AIPG_AVATAR_SUPABASE_URL, supabaseKey);

    const ctaText =
      profile.primaryCTA === "Custom" ? profile.customCTA : profile.primaryCTA;

    const { data: practice, error: dbError } = await supabase
      .from("practices")
      .insert({
        practice_name: profile.practiceName,
        doctor_name: profile.doctorName,
        city: profile.city,
        state: profile.state,
        specialty: profile.specialty,
        services: profile.services,
        primary_cta: ctaText,
        brand_voice: profile.brandVoice,
        target_patient: profile.targetPatient,
        avg_case_value: profile.avgCaseValue ? Number(profile.avgCaseValue) : null,
        monthly_new_patient_goal: profile.monthlyGoal ? Number(profile.monthlyGoal) : null,
        unique_value: profile.uniqueValue,
        elevenlabs_voice_id: elevenlabsVoiceId,
        heygen_training_status: photoAssetIds.length > 0 ? "pending" : "no_photos",
        onboarding_complete: false,
      })
      .select("id")
      .single();

    if (dbError || !practice) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json({ error: "DB insert failed", details: dbError?.message }, { status: 500 });
    }

    const practiceId = practice.id;

    // 2. Store voice clone ID in voices table (if provided)
    if (elevenlabsVoiceId) {
      await supabase.from("voices").insert({
        practice_id: practiceId,
        elevenlabs_voice_id: elevenlabsVoiceId,
        voice_name: `${profile.doctorName} - ${profile.practiceName}`,
        voice_type: "instant_clone",
        status: "ready",
      });
    }

    // 3. Trigger n8n Onboarding workflow
    // The workflow will: create avatar group → train → poll → store heygen_avatar_id → notify
    let workflowExecutionId: string | null = null;

    if (photoAssetIds.length > 0) {
      try {
        const n8nRes = await fetch(N8N_ONBOARD_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practiceId,
            practiceName: profile.practiceName,
            doctorName: profile.doctorName,
            photoAssetIds,
            elevenlabsVoiceId,
            notifyEmail: "blake@aipg.com",
          }),
        });

        if (n8nRes.ok) {
          const n8nData = await n8nRes.json().catch(() => ({}));
          workflowExecutionId = n8nData?.executionId || "triggered";
        } else {
          console.warn("n8n webhook failed:", await n8nRes.text());
          // Don't fail the whole request — practice is in DB, can retry workflow
        }
      } catch (n8nErr) {
        console.warn("n8n trigger error (non-fatal):", n8nErr);
      }
    }

    return NextResponse.json({
      practiceId,
      workflowExecutionId,
      message: "Onboarding submitted. Avatar training started.",
    });
  } catch (err) {
    console.error("onboard route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
