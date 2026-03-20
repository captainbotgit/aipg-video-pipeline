export default function Home() {
  const compositions = [
    // Original 4 (video-backed)
    { id: "DentalExplainer", duration: "60s", type: "A-Roll + Captions" },
    { id: "QuickTip", duration: "15s", type: "A-Roll + Captions" },
    { id: "BeforeAfter", duration: "10s", type: "Image Comparison" },
    { id: "Testimonial", duration: "20s", type: "A-Roll + Stars" },
    // Migrated 4 (graphics-only)
    { id: "DidYouKnow", duration: "30s", type: "Motion Graphics" },
    { id: "PatientStory", duration: "30s", type: "Karaoke Quote" },
    { id: "ProcedureSpotlight", duration: "30s", type: "Benefit Cards" },
    { id: "BeforeAfterReveal", duration: "30s", type: "Wipe Reveal" },
  ];

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 800,
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>
        🎬 AIPG Video Pipeline
      </h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Remotion v4 · Next.js 15 · Vercel Sandbox · {compositions.length}{" "}
        compositions
      </p>

      <h2 style={{ fontSize: 20, marginBottom: 16 }}>API Endpoints</h2>
      <ul style={{ lineHeight: 2, marginBottom: 32 }}>
        <li>
          <code>POST /api/render</code> — render a composition to MP4
        </li>
        <li>
          <code>POST /api/ffmpeg/process</code> — trim / merge / burn captions
        </li>
        <li>
          <code>GET /api/status/[jobId]</code> — check render job status
        </li>
      </ul>

      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Compositions</h2>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #eee" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>ID</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Duration</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Type</th>
          </tr>
        </thead>
        <tbody>
          {compositions.map((c, i) => (
            <tr
              key={c.id}
              style={{
                borderBottom: "1px solid #eee",
                background: i % 2 === 0 ? "#fafafa" : "white",
              }}
            >
              <td style={{ padding: "8px 12px" }}>
                <code>{c.id}</code>
              </td>
              <td style={{ padding: "8px 12px" }}>{c.duration}</td>
              <td style={{ padding: "8px 12px" }}>{c.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
