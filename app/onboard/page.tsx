"use client";

import { useState, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface UploadedPhoto {
  file: File;
  previewUrl: string;
  heygenAssetId?: string;
  status: "pending" | "uploading" | "done" | "error";
}

interface VoiceCapture {
  audioBlob?: Blob;
  audioUrl?: string;
  elevenlabsVoiceId?: string;
  uploadStatus: "idle" | "uploading" | "done" | "error";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SPECIALTIES = [
  "General Dentistry",
  "Cosmetic Dentistry",
  "Implant Dentistry",
  "Orthodontics",
  "Periodontics",
  "Endodontics",
  "Oral Surgery",
  "Pediatric Dentistry",
  "Family Dentistry",
  "Multi-Specialty DSO",
];

const SERVICES_LIST = [
  "Dental Implants",
  "All-on-4 / All-on-X",
  "Veneers",
  "Teeth Whitening",
  "Invisalign / Clear Aligners",
  "Braces",
  "Crowns & Bridges",
  "Dentures",
  "Bonding & Composite",
  "Smile Makeovers",
  "Emergency Dentistry",
  "Root Canals",
  "Extractions",
  "Cleanings & Hygiene",
  "Periodontal Treatment",
  "Sedation Dentistry",
  "TMJ / Nightguards",
  "Sleep Apnea",
];

const CTA_OPTIONS = [
  "Book a Free Consultation",
  "Call Us Today",
  "Schedule Your Appointment",
  "Claim Your Free Smile Analysis",
  "Limited Time Offer – Book Now",
  "Get Your Free Implant Consultation",
  "See If You Qualify",
  "Custom",
];

const VOICE_OPTIONS = [
  { value: "professional", label: "Professional & Clinical", desc: "Authority-forward, credential-focused" },
  { value: "friendly", label: "Friendly & Approachable", desc: "Warm, conversational, community-feel" },
  { value: "luxury", label: "Luxury & Boutique", desc: "Premium positioning, exclusivity" },
  { value: "educational", label: "Educational & Informative", desc: "Myth-busting, FAQ-style, trust-building" },
  { value: "motivational", label: "Motivational & Transformation", desc: "Confidence-focused, life-changing" },
];

const TARGET_PATIENTS = [
  "Anyone (broad awareness)",
  "Implant candidates (missing teeth)",
  "Cosmetic patients (smile improvement)",
  "Invisalign prospects (straightening)",
  "Emergency patients (pain relief)",
  "Insurance-friendly families",
  "High-value cosmetic / cash-pay",
  "Seniors (denture alternatives)",
];

const VOICE_SCRIPT = `Hi, my name is [YOUR NAME] and I'm the doctor here at [PRACTICE NAME].

I want to take a moment to talk about something that I see every single day in my practice — patients who have been living with dental problems for years, sometimes decades, because they were afraid of the cost, afraid of the pain, or just didn't know where to start.

Here's what I want you to know. Modern dentistry has changed everything. Whether you're missing teeth, unhappy with your smile, or just overdue for care — there are real, permanent solutions available to you today. Solutions that are comfortable, fast, and more affordable than most people expect.

At our practice, we believe every patient deserves to walk out of here with confidence. We take the time to understand your goals, your concerns, and your budget. Then we build a plan that actually works for your life.

If you've been putting off dental care, or if you're curious about what's possible for your smile, I'd love to have a conversation. Our consultations are free, there's no pressure, and you'll leave with a clear picture of your options.

Give us a call, book online, or stop by. We're here, and we're ready to help. Thank you.`;

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  page: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    background: "#0A0A0A",
    minHeight: "100vh",
    color: "#f0f0f0",
    padding: "40px 24px",
  } as React.CSSProperties,
  container: {
    maxWidth: 720,
    margin: "0 auto",
  } as React.CSSProperties,
  header: {
    marginBottom: 40,
  } as React.CSSProperties,
  logo: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "#02FEEF",
    textTransform: "uppercase" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    lineHeight: 1.6,
  },
  stepIndicator: {
    display: "flex",
    gap: 8,
    marginBottom: 40,
  } as React.CSSProperties,
  stepDot: (active: boolean, done: boolean): React.CSSProperties => ({
    height: 4,
    flex: 1,
    borderRadius: 2,
    background: done ? "#02FEEF" : active ? "#02FEEF" : "#222",
    opacity: done ? 1 : active ? 0.8 : 1,
    transition: "all 0.3s",
  }),
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 12,
    padding: "32px 28px",
    marginBottom: 20,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
    color: "#fff",
  },
  sectionDesc: {
    fontSize: 13,
    color: "#666",
    marginBottom: 24,
    lineHeight: 1.5,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#aaa",
    marginBottom: 6,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
  input: {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f0f0f0",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  },
  textarea: {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f0f0f0",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
    minHeight: 80,
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
  select: {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f0f0f0",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    cursor: "pointer",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 20,
  } as React.CSSProperties,
  fieldGroup: {
    marginBottom: 20,
  } as React.CSSProperties,
  checkGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  } as React.CSSProperties,
  checkItem: (selected: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: selected ? "rgba(2,254,239,0.08)" : "#1a1a1a",
    border: `1px solid ${selected ? "#02FEEF" : "#2a2a2a"}`,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    color: selected ? "#02FEEF" : "#aaa",
    transition: "all 0.15s",
    userSelect: "none",
  }),
  voiceOption: (selected: boolean): React.CSSProperties => ({
    padding: "12px 16px",
    background: selected ? "rgba(2,254,239,0.08)" : "#1a1a1a",
    border: `1px solid ${selected ? "#02FEEF" : "#2a2a2a"}`,
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 8,
    transition: "all 0.15s",
    userSelect: "none",
  }),
  voiceOptionLabel: (selected: boolean): React.CSSProperties => ({
    fontSize: 14,
    fontWeight: 600,
    color: selected ? "#02FEEF" : "#ddd",
    marginBottom: 2,
  }),
  voiceOptionDesc: {
    fontSize: 12,
    color: "#666",
  } as React.CSSProperties,
  dropZone: (isDragging: boolean, hasFiles: boolean): React.CSSProperties => ({
    border: `2px dashed ${isDragging ? "#02FEEF" : hasFiles ? "#333" : "#2a2a2a"}`,
    borderRadius: 12,
    padding: "32px 24px",
    textAlign: "center",
    cursor: "pointer",
    background: isDragging ? "rgba(2,254,239,0.04)" : "#1a1a1a",
    transition: "all 0.2s",
  }),
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginTop: 16,
  } as React.CSSProperties,
  photoThumb: {
    aspectRatio: "1",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    background: "#222",
  } as React.CSSProperties,
  statusBadge: (status: string): React.CSSProperties => ({
    position: "absolute",
    bottom: 4,
    right: 4,
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    background:
      status === "done"
        ? "#02FEEF"
        : status === "error"
        ? "#ff4444"
        : status === "uploading"
        ? "#B55DFD"
        : "#333",
    color: status === "done" ? "#000" : "#fff",
  }),
  btnPrimary: {
    background: "#02FEEF",
    color: "#000",
    border: "none",
    borderRadius: 8,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  } as React.CSSProperties,
  btnSecondary: {
    background: "transparent",
    color: "#aaa",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 12,
  } as React.CSSProperties,
  btnRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
  } as React.CSSProperties,
  recordBtn: (recording: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 24px",
    background: recording ? "#ff4444" : "#1a1a1a",
    border: `1px solid ${recording ? "#ff4444" : "#333"}`,
    borderRadius: 10,
    color: recording ? "#fff" : "#ddd",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  recordDot: (recording: boolean): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: recording ? "#fff" : "#ff4444",
    animation: recording ? "pulse 1s infinite" : "none",
  }),
  audioPlayer: {
    width: "100%",
    marginTop: 16,
    borderRadius: 8,
    background: "#1a1a1a",
  } as React.CSSProperties,
  scriptBox: {
    background: "#0d0d0d",
    border: "1px solid #1e1e1e",
    borderRadius: 8,
    padding: "16px 20px",
    fontSize: 13,
    lineHeight: 1.8,
    color: "#888",
    maxHeight: 240,
    overflow: "auto",
    marginBottom: 16,
    whiteSpace: "pre-wrap" as const,
    fontFamily: "Georgia, serif",
  },
  infoBox: {
    background: "rgba(2,254,239,0.04)",
    border: "1px solid rgba(2,254,239,0.15)",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#888",
    lineHeight: 1.6,
    marginBottom: 16,
  } as React.CSSProperties,
  warningBox: {
    background: "rgba(181,93,253,0.06)",
    border: "1px solid rgba(181,93,253,0.2)",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#aaa",
    lineHeight: 1.6,
    marginBottom: 16,
  } as React.CSSProperties,
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #1a1a1a",
    fontSize: 14,
  } as React.CSSProperties,
  summaryLabel: { color: "#666" },
  summaryValue: { color: "#ddd", fontWeight: 500, textAlign: "right" as const, maxWidth: "60%" },
  pill: {
    display: "inline-block",
    background: "rgba(2,254,239,0.1)",
    color: "#02FEEF",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    margin: "2px 3px",
  } as React.CSSProperties,
  successBox: {
    textAlign: "center" as const,
    padding: "48px 32px",
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
    color: "#02FEEF",
  },
  successDesc: {
    fontSize: 15,
    color: "#888",
    lineHeight: 1.7,
    maxWidth: 440,
    margin: "0 auto 32px",
  },
  videoPreview: {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  } as React.CSSProperties,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [practiceId, setPracticeId] = useState<string>("");

  const [profile, setProfile] = useState<PracticeProfile>({
    practiceName: "",
    doctorName: "",
    city: "",
    state: "",
    specialty: "",
    services: [],
    primaryCTA: "Book a Free Consultation",
    customCTA: "",
    brandVoice: "friendly",
    targetPatient: "",
    avgCaseValue: "",
    monthlyGoal: "",
    uniqueValue: "",
  });

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [voice, setVoice] = useState<VoiceCapture>({ uploadStatus: "idle" });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  // ── Profile helpers ──

  const updateProfile = (key: keyof PracticeProfile, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const toggleService = (svc: string) =>
    setProfile((p) => ({
      ...p,
      services: p.services.includes(svc)
        ? p.services.filter((s) => s !== svc)
        : [...p.services, svc],
    }));

  // ── Photo upload ──

  const uploadPhotoToHeyGen = async (file: File, idx: number) => {
    setPhotos((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, status: "uploading" } : p))
    );
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/onboard/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.assetId) {
        setPhotos((prev) =>
          prev.map((p, i) =>
            i === idx
              ? { ...p, status: "done", heygenAssetId: data.assetId }
              : p
          )
        );
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch {
      setPhotos((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, status: "error" } : p))
      );
    }
  };

  const handlePhotoDrop = useCallback(
    async (files: File[]) => {
      const validFiles = files
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, 5 - photos.length);
      if (!validFiles.length) return;

      const newPhotos: UploadedPhoto[] = validFiles.map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "pending",
      }));

      setPhotos((prev) => {
        const updated = [...prev, ...newPhotos];
        // kick off uploads after state settles
        updated.forEach((p, idx) => {
          if (p.status === "pending" && idx >= prev.length) {
            setTimeout(() => uploadPhotoToHeyGen(p.file, idx), 100);
          }
        });
        return updated;
      });
    },
    [photos.length] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  // ── Voice recording ──

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setVoice({ audioBlob: blob, audioUrl: url, uploadStatus: "idle" });
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(
        () => setRecordingSeconds((s) => s + 1),
        1000
      );
    } catch {
      alert("Microphone access denied. Please allow microphone access and try again.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const handleVoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVoice({ audioBlob: file, audioUrl: url, uploadStatus: "idle" });
  };

  const uploadVoiceToElevenLabs = async () => {
    if (!voice.audioBlob) return;
    setVoice((v) => ({ ...v, uploadStatus: "uploading" }));
    try {
      const formData = new FormData();
      formData.append(
        "audio",
        voice.audioBlob,
        `${profile.doctorName || "doctor"}-voice.${
          voice.audioBlob.type.includes("webm") ? "webm" : "mp3"
        }`
      );
      formData.append("name", `${profile.doctorName} - ${profile.practiceName}`);
      const res = await fetch("/api/onboard/upload-voice", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.voiceId) {
        setVoice((v) => ({
          ...v,
          elevenlabsVoiceId: data.voiceId,
          uploadStatus: "done",
        }));
      } else {
        throw new Error(data.error || "Voice upload failed");
      }
    } catch (err) {
      console.error(err);
      setVoice((v) => ({ ...v, uploadStatus: "error" }));
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Submission ──

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const photoAssetIds = photos
        .filter((p) => p.heygenAssetId)
        .map((p) => p.heygenAssetId!);

      const payload = {
        profile,
        photoAssetIds,
        elevenlabsVoiceId: voice.elevenlabsVoiceId || null,
        consentGiven: true,
      };

      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.practiceId) {
        setPracticeId(data.practiceId);
        setSubmitted(true);
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Validation ──

  const step1Valid =
    profile.practiceName.trim() &&
    profile.doctorName.trim() &&
    profile.city.trim() &&
    profile.specialty &&
    profile.services.length > 0;

  const step2Valid = photos.filter((p) => p.status === "done").length >= 1;

  const step3Valid =
    voice.uploadStatus === "done" || voice.audioBlob !== undefined;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.card}>
            <div style={s.successBox}>
              <div style={s.successIcon}>🎉</div>
              <div style={s.successTitle}>Avatar Training Started!</div>
              <p style={s.successDesc}>
                We&apos;re training Dr. {profile.doctorName}&apos;s avatar now. This takes
                about 24 hours. You&apos;ll get an email when it&apos;s ready and the first
                video can be generated.
              </p>

              <div style={{ ...s.card, textAlign: "left", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#02FEEF", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  What happens next
                </div>
                {[
                  ["🖼️", "Photos processing", "HeyGen training photo avatar (~$4 one-time)"],
                  ["🎙️", "Voice cloning", "ElevenLabs voice clone ready in minutes"],
                  ["📝", "Script library", "Dental scripts queued for your services"],
                  ["🎬", "First video", "~$0.55 · Ready within 24 hours"],
                  ["📧", "Email delivery", `Link sent to blake@aipg.com`],
                ].map(([icon, label, desc]) => (
                  <div key={label} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#ddd" }}>{label}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {practiceId && (
                <div style={{ fontSize: 12, color: "#444", marginTop: 8 }}>
                  Practice ID: {practiceId}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{`
        input:focus, textarea:focus, select:focus { border-color: #02FEEF !important; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>

      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.logo}>AIPG · Avatar Onboarding</div>
          <h1 style={s.title}>Set up your client&apos;s AI avatar</h1>
          <p style={s.subtitle}>
            Complete this once. Generate unlimited scripted dental videos — voiced and
            faced by the doctor — forever.
          </p>
        </div>

        {/* Step indicator */}
        <div style={s.stepIndicator}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={s.stepDot(step === n, step > n)} />
          ))}
        </div>

        {/* ── Step 1: Practice Profile ── */}
        {step === 1 && (
          <>
            <div style={s.card}>
              <div style={s.sectionTitle}>Practice Profile</div>
              <div style={s.sectionDesc}>
                This data powers every script we write — procedure focus, CTA, voice, target
                patient, and competitive angle.
              </div>

              <div style={s.row}>
                <div>
                  <label style={s.label}>Practice Name *</label>
                  <input
                    style={s.input}
                    value={profile.practiceName}
                    onChange={(e) => updateProfile("practiceName", e.target.value)}
                    placeholder="Atlanta Dental Spa"
                  />
                </div>
                <div>
                  <label style={s.label}>Doctor Name *</label>
                  <input
                    style={s.input}
                    value={profile.doctorName}
                    onChange={(e) => updateProfile("doctorName", e.target.value)}
                    placeholder="Dr. Sarah Chen"
                  />
                </div>
              </div>

              <div style={s.row}>
                <div>
                  <label style={s.label}>City *</label>
                  <input
                    style={s.input}
                    value={profile.city}
                    onChange={(e) => updateProfile("city", e.target.value)}
                    placeholder="Atlanta"
                  />
                </div>
                <div>
                  <label style={s.label}>State</label>
                  <input
                    style={s.input}
                    value={profile.state}
                    onChange={(e) => updateProfile("state", e.target.value)}
                    placeholder="GA"
                    maxLength={2}
                  />
                </div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Specialty *</label>
                <select
                  style={s.select}
                  value={profile.specialty}
                  onChange={(e) => updateProfile("specialty", e.target.value)}
                >
                  <option value="">Select specialty…</option>
                  {SPECIALTIES.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Services Offered * (select all that apply)</label>
                <div style={s.checkGrid}>
                  {SERVICES_LIST.map((svc) => (
                    <div
                      key={svc}
                      style={s.checkItem(profile.services.includes(svc))}
                      onClick={() => toggleService(svc)}
                    >
                      <span style={{ fontSize: 14 }}>
                        {profile.services.includes(svc) ? "✓" : "○"}
                      </span>
                      {svc}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.sectionTitle}>Marketing Strategy</div>
              <div style={s.sectionDesc}>
                Drives script tone, hook style, CTA urgency, and audience targeting.
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Brand Voice</label>
                {VOICE_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    style={s.voiceOption(profile.brandVoice === opt.value)}
                    onClick={() => updateProfile("brandVoice", opt.value)}
                  >
                    <div style={s.voiceOptionLabel(profile.brandVoice === opt.value)}>
                      {profile.brandVoice === opt.value ? "● " : "○ "}{opt.label}
                    </div>
                    <div style={s.voiceOptionDesc}>{opt.desc}</div>
                  </div>
                ))}
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Primary Call-to-Action</label>
                <select
                  style={s.select}
                  value={profile.primaryCTA}
                  onChange={(e) => updateProfile("primaryCTA", e.target.value)}
                >
                  {CTA_OPTIONS.map((cta) => (
                    <option key={cta} value={cta}>{cta}</option>
                  ))}
                </select>
                {profile.primaryCTA === "Custom" && (
                  <input
                    style={{ ...s.input, marginTop: 8 }}
                    value={profile.customCTA}
                    onChange={(e) => updateProfile("customCTA", e.target.value)}
                    placeholder="Enter your custom CTA…"
                  />
                )}
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Target Patient</label>
                <select
                  style={s.select}
                  value={profile.targetPatient}
                  onChange={(e) => updateProfile("targetPatient", e.target.value)}
                >
                  <option value="">Select primary target…</option>
                  {TARGET_PATIENTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={s.row}>
                <div>
                  <label style={s.label}>Avg Case Value ($)</label>
                  <input
                    style={s.input}
                    value={profile.avgCaseValue}
                    onChange={(e) => updateProfile("avgCaseValue", e.target.value)}
                    placeholder="3500"
                    type="number"
                  />
                </div>
                <div>
                  <label style={s.label}>Monthly New Patient Goal</label>
                  <input
                    style={s.input}
                    value={profile.monthlyGoal}
                    onChange={(e) => updateProfile("monthlyGoal", e.target.value)}
                    placeholder="20"
                    type="number"
                  />
                </div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>What makes this practice unique?</label>
                <textarea
                  style={s.textarea}
                  value={profile.uniqueValue}
                  onChange={(e) => updateProfile("uniqueValue", e.target.value)}
                  placeholder="e.g. Same-day implants, 20 years experience, spa-like environment, only Invisalign Elite provider in the city…"
                />
              </div>
            </div>

            <div style={s.btnRow}>
              <div />
              <button
                style={{
                  ...s.btnPrimary,
                  opacity: step1Valid ? 1 : 0.4,
                  cursor: step1Valid ? "pointer" : "not-allowed",
                }}
                onClick={() => step1Valid && setStep(2)}
              >
                Next: Upload Photos →
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Photos ── */}
        {step === 2 && (
          <>
            <div style={s.card}>
              <div style={s.sectionTitle}>Doctor Headshots</div>
              <div style={s.sectionDesc}>
                3–5 photos train a custom HeyGen photo avatar. The avatar lip-syncs to
                any audio we generate — making the doctor the face of every video, forever.
              </div>

              <div style={s.infoBox}>
                <strong style={{ color: "#02FEEF" }}>📸 Photo requirements:</strong>
                <br />
                • Front-facing, even lighting (no sunglasses, hats, heavy filters)
                <br />
                • Mix of: neutral expression, natural smile, slight angle
                <br />
                • High resolution preferred (phone camera is fine)
                <br />
                • White or plain background preferred but not required
              </div>

              <div
                style={s.dropZone(isDragging, photos.length > 0)}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handlePhotoDrop(Array.from(e.dataTransfer.files));
                }}
                onClick={() => photoInputRef.current?.click()}
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) =>
                    handlePhotoDrop(Array.from(e.target.files || []))
                  }
                />
                {photos.length === 0 ? (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                      Drop photos here or click to browse
                    </div>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      Up to 5 photos · JPG, PNG, HEIC
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {photos.length}/5 uploaded — click to add more
                  </div>
                )}
              </div>

              {photos.length > 0 && (
                <div style={s.photoGrid}>
                  {photos.map((photo, idx) => (
                    <div key={idx} style={s.photoThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.previewUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={s.statusBadge(photo.status)}>
                        {photo.status === "uploading"
                          ? "…"
                          : photo.status === "done"
                          ? "✓"
                          : photo.status === "error"
                          ? "✕"
                          : "○"}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: 12,
                          color: "#fff",
                        }}
                        onClick={() => removePhoto(idx)}
                      >
                        ✕
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.btnRow}>
              <button style={s.btnSecondary} onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                style={{
                  ...s.btnPrimary,
                  opacity: step2Valid ? 1 : 0.4,
                  cursor: step2Valid ? "pointer" : "not-allowed",
                }}
                onClick={() => step2Valid && setStep(3)}
              >
                Next: Voice Recording →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Voice ── */}
        {step === 3 && (
          <>
            <div style={s.card}>
              <div style={s.sectionTitle}>Voice Clone</div>
              <div style={s.sectionDesc}>
                1–2 minutes of the doctor reading the script below creates an instant
                voice clone. Every future video will sound exactly like them.
              </div>

              <div style={s.warningBox}>
                <strong style={{ color: "#B55DFD" }}>🎙️ Recording tips:</strong>
                <br />
                • Quiet room — no AC, fans, or background noise
                <br />
                • Normal speaking pace (not reading stiffly)
                <br />
                • Phone or laptop mic is fine — no studio needed
                <br />
                • Aim for 90 seconds minimum for best clone quality
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Script to read aloud</label>
                <div style={s.scriptBox}>{VOICE_SCRIPT}</div>
              </div>

              {/* Record or upload */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <button
                  style={s.recordBtn(isRecording)}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  <span style={s.recordDot(isRecording)} />
                  {isRecording
                    ? `Recording… ${formatTime(recordingSeconds)}`
                    : voice.audioBlob
                    ? "Re-record"
                    : "Record Now"}
                </button>

                <button
                  style={{
                    ...s.recordBtn(false),
                    background: "#1a1a1a",
                  }}
                  onClick={() => voiceInputRef.current?.click()}
                >
                  📁 Upload Audio File
                </button>
                <input
                  ref={voiceInputRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: "none" }}
                  onChange={handleVoiceFileChange}
                />
              </div>

              {voice.audioUrl && (
                <div>
                  <audio
                    controls
                    src={voice.audioUrl}
                    style={s.audioPlayer}
                  />

                  {voice.uploadStatus === "idle" && (
                    <div style={{ marginTop: 12 }}>
                      <button style={s.btnPrimary} onClick={uploadVoiceToElevenLabs}>
                        Clone This Voice →
                      </button>
                    </div>
                  )}
                  {voice.uploadStatus === "uploading" && (
                    <div style={{ marginTop: 12, color: "#B55DFD", fontSize: 14 }}>
                      ⏳ Cloning voice with ElevenLabs…
                    </div>
                  )}
                  {voice.uploadStatus === "done" && (
                    <div style={{ marginTop: 12, color: "#02FEEF", fontSize: 14 }}>
                      ✅ Voice clone created — Voice ID: {voice.elevenlabsVoiceId}
                    </div>
                  )}
                  {voice.uploadStatus === "error" && (
                    <div style={{ marginTop: 12, color: "#ff4444", fontSize: 14 }}>
                      ✕ Clone failed. Try again or skip to use a stock voice.
                    </div>
                  )}
                </div>
              )}

              {!voice.audioBlob && (
                <div style={{ marginTop: 12, fontSize: 13, color: "#555" }}>
                  No audio yet — or{" "}
                  <span
                    style={{ color: "#666", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setStep(4)}
                  >
                    skip and use stock voice for now
                  </span>
                </div>
              )}
            </div>

            <div style={s.btnRow}>
              <button style={s.btnSecondary} onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                style={{
                  ...s.btnPrimary,
                  opacity: step3Valid ? 1 : 0.4,
                  cursor: step3Valid ? "pointer" : "not-allowed",
                }}
                onClick={() => step3Valid && setStep(4)}
              >
                Next: Review & Submit →
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <>
            <div style={s.card}>
              <div style={s.sectionTitle}>Review & Submit</div>
              <div style={s.sectionDesc}>
                Confirm everything looks right. Submitting starts avatar training ($4
                one-time HeyGen charge from your account).
              </div>

              {/* Practice summary */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                  Practice
                </div>
                {[
                  ["Doctor", `Dr. ${profile.doctorName}`],
                  ["Practice", profile.practiceName],
                  ["Location", `${profile.city}${profile.state ? `, ${profile.state}` : ""}`],
                  ["Specialty", profile.specialty],
                  ["Brand Voice", VOICE_OPTIONS.find(v => v.value === profile.brandVoice)?.label],
                  ["Primary CTA", profile.primaryCTA === "Custom" ? profile.customCTA : profile.primaryCTA],
                  ["Target Patient", profile.targetPatient || "—"],
                ].map(([label, value]) => (
                  <div key={label} style={s.summaryRow}>
                    <span style={s.summaryLabel}>{label}</span>
                    <span style={s.summaryValue}>{value}</span>
                  </div>
                ))}
                <div style={{ ...s.summaryRow, borderBottom: "none", alignItems: "flex-start" }}>
                  <span style={s.summaryLabel}>Services</span>
                  <span style={{ ...s.summaryValue, textAlign: "right" }}>
                    {profile.services.map((svc) => (
                      <span key={svc} style={s.pill}>{svc}</span>
                    ))}
                  </span>
                </div>
              </div>

              {/* Assets summary */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                  Assets
                </div>
                <div style={s.videoPreview}>
                  <span style={{ fontSize: 24 }}>🖼️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {photos.filter(p => p.status === "done").length} photos uploaded
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {photos.filter(p => p.status === "done").length < 3
                        ? "⚠️ Recommend 3+ for best avatar quality"
                        : "✓ Good to go"}
                    </div>
                  </div>
                </div>
                <div style={s.videoPreview}>
                  <span style={{ fontSize: 24 }}>🎙️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {voice.uploadStatus === "done"
                        ? "Voice clone ready"
                        : voice.audioBlob
                        ? "Audio recorded (not yet cloned)"
                        : "No voice — stock voice will be used"}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {voice.elevenlabsVoiceId
                        ? `Voice ID: ${voice.elevenlabsVoiceId}`
                        : voice.uploadStatus === "done"
                        ? "ElevenLabs IVC ready"
                        : "ElevenLabs Instant Voice Clone"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost reminder */}
              <div style={s.infoBox}>
                <strong style={{ color: "#02FEEF" }}>💰 What this costs:</strong>
                <br />
                • Avatar training: <strong>$4 one-time</strong> (from HeyGen account)
                <br />
                • Voice clone: <strong>Free</strong> (ElevenLabs IVC)
                <br />
                • Per video generated: <strong>~$0.55</strong> (script + voice TTS + avatar render)
              </div>

              <div style={s.btnRow}>
                <button style={s.btnSecondary} onClick={() => setStep(3)}>
                  ← Back
                </button>
                <button
                  style={{ ...s.btnPrimary, opacity: submitting ? 0.6 : 1 }}
                  onClick={submitting ? undefined : handleSubmit}
                >
                  {submitting ? "⏳ Submitting…" : "🚀 Start Avatar Training"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
