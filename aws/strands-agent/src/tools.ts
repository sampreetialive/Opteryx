import { tool } from "@strands-agents/sdk";

export const validateScanReport = tool({
  name: "validate_scan_report",
  description: "Validate a ScamShield JSON report for score bounds, level consistency, evidence, and safety actions.",
  inputSchema: {
    type: "object",
    properties: { report: { type: "object", description: "ScamShield analysis object" } },
    required: ["report"]
  },
  callback: (input) => {
    const report = input?.report || {};
    const score = Number(report.risk_score);
    const level = String(report.risk_level || "");
    const issues = [];
    if (!Number.isFinite(score) || score < 0 || score > 100) issues.push("risk_score must be 0-100");
    const expected = score >= 70 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";
    if ([ "LOW", "MEDIUM", "HIGH" ].includes(level) && level !== expected) issues.push("risk_level does not match risk_score");
    if (!Array.isArray(report.why) || report.why.length === 0) issues.push("missing warning evidence");
    if (!Array.isArray(report.action_plan) || report.action_plan.length === 0) issues.push("missing safety action plan");
    return { valid: issues.length === 0, issues, expected_level: expected };
  }
});

export const safetyChecklist = tool({
  name: "generate_safety_checklist",
  description: "Generate conservative next steps from the scam category and risk level.",
  inputSchema: {
    type: "object",
    properties: { category: { type: "string" }, risk_level: { type: "string" } },
    required: ["category", "risk_level"]
  },
  callback: (input) => {
    const category = String(input?.category || "Other");
    const risk = String(input?.risk_level || "MEDIUM");
    const checklist = [
      "Do not click links or open attachments until independently verified.",
      "Do not share OTPs, passwords, PINs, CVVs, card numbers, or recovery codes.",
      "Verify the sender through an official website or known contact method."
    ];
    if (risk === "HIGH") checklist.unshift("Pause the transaction or conversation before taking further action.");
    if (/payment|bank|kyc|phishing|qr/i.test(category)) checklist.push("Use the bank or service official app/site instead of the message link.");
    if (/job|internship/i.test(category)) checklist.push("Do not pay an upfront fee for a job or internship without independent verification.");
    return { category, risk_level: risk, checklist };
  }
});

export async function callScamShield(message, url, image) {
  const endpoint = String(process.env.SUPABASE_FUNCTION_URL || "").trim().replace(/\/+$/, "");
  if (!endpoint) throw new Error("SUPABASE_FUNCTION_URL is missing.");
  const response = await fetch(endpoint + "?action=analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message || "", url: url || "", image: image || "" }),
    signal: AbortSignal.timeout(20000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "ScamShield backend request failed.");
  return data;
}