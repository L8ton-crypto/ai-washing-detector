import { ImageResponse } from "next/og";
import { ensureDb, getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CardRow = {
  id: number;
  label: string | null;
  plausibility_score: number;
  verdict: string;
  one_liner: string;
};

function paletteFor(score: number) {
  if (score >= 75) {
    return { ring: "#10b981", text: "#a7f3d0", chip: "rgba(16,185,129,0.15)" };
  }
  if (score >= 50) {
    return { ring: "#facc15", text: "#fde68a", chip: "rgba(250,204,21,0.15)" };
  }
  if (score >= 25) {
    return { ring: "#f59e0b", text: "#fcd34d", chip: "rgba(245,158,11,0.15)" };
  }
  return { ring: "#f87171", text: "#fecaca", chip: "rgba(248,113,113,0.15)" };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0 || numId > 2_147_483_647) {
    return new Response("Not found", { status: 404 });
  }

  let row: CardRow | null = null;
  try {
    await ensureDb();
    const db = getDb();
    const rows = (await db`
      SELECT id, label, plausibility_score, verdict, one_liner
      FROM aiwd_paste
      WHERE id = ${numId}
      LIMIT 1
    `) as CardRow[];
    row = rows[0] || null;
  } catch (err) {
    console.error("og-image fetch error:", err);
  }

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  const palette = paletteFor(row.plausibility_score);
  const label = (row.label || "Anonymous claim").slice(0, 80);
  const oneLiner = row.one_liner.slice(0, 220);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #000000 0%, #0a0a0a 60%, #111827 100%)",
          color: "#e5e7eb",
          padding: "60px 70px",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#34d399" }} />
          <div style={{ fontSize: "22px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#9ca3af" }}>
            AI-Washing Detector
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "30px", color: "#9ca3af", maxWidth: "1080px", display: "flex" }}>
            {label}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "40px" }}>
            <div
              style={{
                fontSize: "180px",
                fontWeight: 700,
                lineHeight: 1,
                color: palette.text,
                fontVariantNumeric: "tabular-nums",
                display: "flex",
              }}
            >
              {row.plausibility_score}
              <span style={{ fontSize: "60px", color: "#4b5563", marginLeft: "12px", display: "flex", alignItems: "flex-end" }}>
                /100
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "20px" }}>
              <div style={{ fontSize: "26px", color: "#9ca3af", letterSpacing: "0.16em", textTransform: "uppercase", display: "flex" }}>
                Verdict
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "60px",
                  fontWeight: 600,
                  color: "#ffffff",
                  background: palette.chip,
                  border: `2px solid ${palette.ring}`,
                  borderRadius: "16px",
                  padding: "10px 22px",
                }}
              >
                {row.verdict}
              </div>
            </div>
          </div>
          <div style={{ fontSize: "32px", color: "#d1d5db", lineHeight: 1.35, maxWidth: "1080px", display: "flex" }}>
            {oneLiner}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "22px", color: "#6b7280" }}>
            ai-washing-detector.vercel.app
          </div>
          <div style={{ fontSize: "20px", color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Heuristic - not an accusation
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
