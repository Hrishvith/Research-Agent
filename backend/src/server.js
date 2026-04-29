import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import os from "os";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { jsPDF } from "jspdf";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import { startResearch, getJobStatus } from "./services/agent-orchestrator.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exportsDir = path.join(__dirname, "..", "exports");

if (!existsSync(exportsDir)) {
  mkdirSync(exportsDir, { recursive: true });
}

const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (no origin)
      if (!origin) return callback(null, true);
      // Allow explicit configured frontend or common localhost variants
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any localhost or 127.0.0.1 with any port
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);
app.use(express.json());
app.use(
  "/exports",
  express.static(exportsDir, {
    fallthrough: false,
    setHeaders(res) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Content-Disposition", "inline");
    },
  })
);

function getFallbackPublicBaseUrl(req) {
  const forwardedHost = req.get("x-forwarded-host") || req.get("host");
  if (forwardedHost && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(forwardedHost)) {
    return `${req.protocol}://${forwardedHost}`;
  }

  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry && entry.family === "IPv4" && !entry.internal) {
        return `${req.protocol}://${entry.address}:${port}`;
      }
    }
  }

  return `http://127.0.0.1:${port}`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "glow-research-backend", timestamp: new Date().toISOString() });
});

// ── Research Agent Routes ────────────────────────────────────────────────────

// POST /api/research/start  { query: string }
// Returns { jobId } immediately; pipeline runs in background.
app.post("/api/research/start", (req, res) => {
  try {
    const query = String(req.body?.query || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Missing or empty query" });
    }
    const jobId = startResearch(query);
    return res.json({ ok: true, jobId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/research/status/:jobId
// Returns full job state including stage, status, result (when done).
app.get("/api/research/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId" });
  }
  const job = getJobStatus(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found or expired" });
  }
  return res.json({ ok: true, job });
});

// POST /api/research/synthesize/:jobId
// Compatibility route expected by frontend. Returns synthesis text for completed jobs.
app.post("/api/research/synthesize/:jobId", (req, res) => {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId" });
  }

  const job = getJobStatus(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found or expired" });
  }

  if (job.status !== "completed" || !job.result) {
    return res.status(409).json({ error: "Synthesis is not ready yet" });
  }

  const synthesis =
    typeof job.result?.synthesis?.summary === "string"
      ? job.result.synthesis.summary
      : typeof job.result?.synthesis === "string"
      ? job.result.synthesis
      : "";

  return res.json({ ok: true, synthesis });
});

function buildPdfFromPayload(payload, pdfUrl) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;

  const lines = [
    "AI Research Summary",
    `Query: ${payload.query || "Research summary"}`,
    `Papers analyzed: ${payload.papers?.length || 0}`,
    `Export URL: ${pdfUrl}`,
    "",
    payload.overview ? `Overview:\n${payload.overview}` : "",
    payload.synthesis ? `Final Synthesis:\n${payload.synthesis}` : "",
    payload.key_findings?.length
      ? `Key Findings:\n${payload.key_findings
          .map((item, index) => `${index + 1}. ${item.paper_title}: ${item.findings}`)
          .join("\n")}`
      : "",
    payload.contradictions?.length
      ? `Contradictions:\n${payload.contradictions.map((item, index) => `${index + 1}. ${item.description}`).join("\n")}`
      : "",
    payload.research_gaps?.length
      ? `Research Gaps:\n${payload.research_gaps.map((item, index) => `${index + 1}. ${item.description}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const wrapped = pdf.splitTextToSize(lines, maxWidth);
  let y = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("AI Research Summary", margin, y);
  y += 24;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  wrapped.forEach((line) => {
    if (y > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 16;
  });

  return Buffer.from(pdf.output("arraybuffer"));
}

app.post(
  "/api/export-synthesis",
  express.raw({ type: ["application/pdf", "application/octet-stream"], limit: "20mb" }),
  (req, res) => {
  try {
    const baseId = String(req.query?.job_id || req.query?.id || `synthesis_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_");
    const synthesisId = `${baseId}_${Math.random().toString(36).slice(2, 8)}`;
    const filename = `${synthesisId}.pdf`;
    const publicBaseUrl = (process.env.PUBLIC_BASE_URL || getFallbackPublicBaseUrl(req)).replace(/\/$/, "");
    const pdfUrl = `${publicBaseUrl}/exports/${filename}`;

    const pdfBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);
    if (!pdfBuffer.length) {
      return res.status(400).json({ error: "Missing PDF file" });
    }

    writeFileSync(path.join(exportsDir, filename), pdfBuffer);

    return res.json({
      ok: true,
      export_id: synthesisId,
      pdf_url: pdfUrl,
      expires_at: null,
    });
  } catch (error) {
    console.error("[export-synthesis] Failed to create PDF:", error);
    return res.status(500).json({ error: "Failed to export synthesis" });
  }
});
// Mount authentication routes
app.use("/api/auth", authRoutes);

async function start() {
  await connectDB();
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}

start();
