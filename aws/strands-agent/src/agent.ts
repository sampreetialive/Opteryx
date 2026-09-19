import fs from "node:fs";
import path from "node:path";
import { Agent } from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";
import { validateScanReport, safetyChecklist, callScamShield } from "./tools.ts";

const MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

function loadInput() {
  const arg = process.argv[2];
  if (!arg) return JSON.parse(fs.readFileSync(path.resolve("example-scan.json"), "utf8"));
  if (arg.startsWith("@")) return JSON.parse(fs.readFileSync(path.resolve(arg.slice(1)), "utf8"));
  try { return JSON.parse(arg); } catch { return { message: arg }; }
}

function model() {
  const key = String(process.env.GROQ_API_KEY || "").trim();
  if (!key) throw new Error("GROQ_API_KEY is missing.");
  return new OpenAIModel({
    api: "chat",
    apiKey: key,
    clientConfig: { baseURL: "https://api.groq.com/openai/v1" },
    modelId: MODEL,
    maxTokens: 1200,
    temperature: 0.2
  });
}

async function getReport(input) {
  if (input?.report && typeof input.report === "object") return input.report;
  if (process.env.SUPABASE_FUNCTION_URL) {
    const result = await callScamShield(input.message, input.url, input.image);
    if (!result?.analysis) throw new Error("ScamShield backend returned no analysis.");
    return result.analysis;
  }
  throw new Error("Provide a report JSON or set SUPABASE_FUNCTION_URL.");
}

async function main() {
  const input = loadInput();
  const report = await getReport(input);
  const agent = new Agent({
    model: model(),
    tools: [validateScanReport, safetyChecklist],
    systemPrompt: [
      "You are the ScamShield AWS investigation agent.",
      "Review the supplied ScamShield report. Never invent evidence.",
      "Never repeat secrets such as OTPs, passwords, PINs, CVVs, card numbers, or recovery codes.",
      "Do not claim certainty about fraud.",
      "First use validate_scan_report.",
      "Then use generate_safety_checklist.",
      "Return a concise investigation brief with risk, evidence, uncertainty, and safe next actions."
    ].join("\n")
  });
  const task = "Review this ScamShield report:\n" + JSON.stringify(report, null, 2) + "\nValidate it, create a safety checklist, then return the investigation brief.";
  const result = await agent.invoke(task);
  console.log("\n=== SCAMSHIELD AWS STRANDS INVESTIGATION ===\n");
  console.log(result.lastMessage?.content || result);
}

main().catch((error) => {
  console.error("AWS Strands agent failed:", error.message);
  process.exitCode = 1;
});