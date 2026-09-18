import { ai, db } from "hatchable";

export const access = "public";
export const methods = ["POST"];

const SYSTEM = `You are ScamShield, a calm scam-awareness AI agent.
Analyze suspicious messages, emails, payment requests, QR/payment instructions, job/internship offers, and links.
Never ask for passwords, OTPs, PINs, card numbers, private keys, or other secrets.
Do not claim certainty. Use evidence from the supplied content.
If a URL is supplied, you may use inspectUrl to retrieve public page text before deciding.
Return ONLY valid JSON with this exact shape:
{
  "risk_score": 0,
  "risk_level": "LOW|MEDIUM|HIGH",
  "category": "Phishing|Fake internship|Fake delivery|Bank/KYC|Job scam|QR/payment scam|Impersonation|Investment scam|Shopping scam|Other",
  "headline": "short human-friendly conclusion",
  "why": ["3 to 5 concrete signals"],
  "explanation": "2 to 4 sentence explanation",
  "action_plan": [
    {"step":"Don't click or pay","priority":"now"},
    {"step":"Verify independently","priority":"next"},
    {"step":"Report or block if appropriate","priority":"later"}
  ],
  "confidence": 0
}`;

function cleanJson(raw) {
  let s = String(raw || "").trim();
  if (s.startsWith("```")) {
    const firstNewline = s.indexOf("\n");
    if (firstNewline >= 0) s = s.slice(firstNewline + 1);
    const fence = s.lastIndexOf("```");
    if (fence >= 0) s = s.slice(0, fence);
  }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}

export default async function (req, res) {
  const body = req.body || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!message && !url) return res.status(400).json({ error: "Paste a message or add a link to analyze." });
  if (message.length > 12000) return res.status(400).json({ error: "Please keep the message under 12,000 characters." });
  if (url && !(url.startsWith("http://") || url.startsWith("https://"))) {
    return res.status(400).json({ error: "Links must start with http:// or https://." });
  }

  const userPrompt = [
    message ? "MESSAGE TO ANALYZE:\\n" + message : "",
    url ? "URL TO CHECK:\\n" + url : ""
  ].filter(Boolean).join("\\n\\n");

  const tools = url ? {
    inspectUrl: {
      description: "Fetch the exact public URL supplied by the user and return a small text sample for scam inspection.",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"]
      },
      execute: async ({ url: target }) => {
        if (!(target.startsWith("http://") || target.startsWith("https://"))) return { error: "Unsupported URL scheme." };
        try {
          const r = await fetch(target, { redirect: "follow" });
          const text = await r.text();
          return {
            status: r.status,
            final_url: r.url || target,
            content_type: r.headers.get("content-type") || "",
            text: text.replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").slice(0, 7000)
          };
        } catch (e) {
          return { error: "Could not retrieve the page. Analyze the URL itself and state that limitation." };
        }
      }
    }
  } : undefined;

  try {
    const result = await ai.generateText({
      model: "sonnet",
      system: SYSTEM,
      prompt: userPrompt,
      ...(tools ? { tools } : {}),
      maxSteps: url ? 4 : 2,
      maxTokens: 2500,
      purpose: "scam-analysis"
    });

    if (result.finishReason === "length") {
      return res.status(502).json({ error: "The analysis was truncated. Please try a shorter message." });
    }

    let analysis;
    try {
      analysis = JSON.parse(cleanJson(result.text));
    } catch {
      return res.status(502).json({ error: "The AI returned an unreadable result. Please try again." });
    }

    analysis.risk_score = Math.max(0, Math.min(100, Number(analysis.risk_score) || 0));
    analysis.confidence = Math.max(0, Math.min(100, Number(analysis.confidence) || 0));

    await db.query(
      "INSERT INTO scan_history (input_type, content_preview, risk_score, risk_level, category, result_json) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        url ? "link" : "message",
        (message || url).slice(0, 500),
        analysis.risk_score,
        analysis.risk_level || "MEDIUM",
        analysis.category || "Other",
        JSON.stringify(analysis)
      ]
    );

    res.json({ analysis, agent_used_tools: Array.isArray(result.steps) && result.steps.length > 1 });
  } catch (error) {
    console.error("ScamShield analysis error", error);
    res.status(500).json({ error: "ScamShield could not complete the analysis. Please try again." });
  }
}