export const SYSTEM_PROMPT = "You are ScamShield, a calm scam-awareness AI agent. Analyze suspicious messages, links, payment requests, job offers, and impersonation. Identify concrete scam indicators, score risk from 0 to 100, explain uncertainty, and give safe next steps. Never ask for passwords, OTPs, PINs, card numbers, private keys, or other secrets. Return ONLY JSON with risk_score, risk_level, category, headline, why, explanation, action_plan, and confidence.";
export function cleanJson(raw) {
  let value = String(raw || "").trim();
  if (value.startsWith("```")) { const n = value.indexOf("\n"); if (n >= 0) value = value.slice(n + 1); const f = value.lastIndexOf("```"); if (f >= 0) value = value.slice(0, f); }
  const start = value.indexOf("{"); const end = value.lastIndexOf("}");
  return start >= 0 && end > start ? value.slice(start, end + 1) : value;
}
export function normalizeAnalysis(a) {
  a = a && typeof a === "object" ? a : {};
  const score = Math.max(0, Math.min(100, Number(a.risk_score) || 0));
  const confidence = Math.max(0, Math.min(100, Number(a.confidence) || 0));
  const level = ["LOW","MEDIUM","HIGH"].includes(a.risk_level) ? a.risk_level : score >= 70 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";
  return { risk_score: score, risk_level: level, category: String(a.category || "Other"), headline: String(a.headline || "Review this content carefully."), why: Array.isArray(a.why) ? a.why.slice(0,5).map(String) : [], explanation: String(a.explanation || ""), action_plan: Array.isArray(a.action_plan) ? a.action_plan.slice(0,3) : [], confidence };
}
function privateIpv4(host) {
  const p = host.split(".").map(Number); if (p.length !== 4 || p.some(Number.isNaN)) return false;
  const [a,b] = p; return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
export function validatePublicUrl(raw) {
  const url = new URL(raw);
  if (!["http:","https:"].includes(url.protocol)) throw new Error("Only http and https URLs are supported.");
  if (url.username || url.password) throw new Error("Embedded URL credentials are not allowed.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "metadata.google.internal" || privateIpv4(host)) throw new Error("Private or local hosts are not allowed.");
  return url;
}
export async function inspectPublicUrl(raw) {
  const url = validatePublicUrl(raw); const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { redirect: "follow", signal: controller.signal, headers: { "user-agent": "ScamShield/1.0 safety-check" } });
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("text/plain")) return { status: response.status, final_url: response.url || raw, content_type: type, text: "" };
    const text = await response.text();
    return { status: response.status, final_url: response.url || raw, content_type: type, text: text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0,8000) };
  } finally { clearTimeout(timer); }
}