const MODEL = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM = `You are ScamShield, a careful scam-awareness AI agent.
Analyze suspicious messages, emails, payment requests, job/internship offers, links, and screenshots.
For screenshots, inspect the image itself as the primary evidence. Read visible text and reason about visual context such as sender names, URLs, logos, buttons, payment requests, urgency, impersonation, and requests for secrets.
Do not request or repeat passwords, OTPs, PINs, card numbers, private keys, or other secrets.
Do not claim certainty. Base conclusions on concrete evidence and explicitly mention uncertainty.
Return ONLY valid JSON matching this structure:
{
  "risk_score": 0,
  "risk_level": "LOW|MEDIUM|HIGH",
  "category": "Phishing|Fake internship|Fake delivery|Bank/KYC|Job scam|QR/payment scam|Impersonation|Investment scam|Shopping scam|Other",
  "headline": "short human-friendly conclusion",
  "why": ["3 to 5 concrete signals"],
  "explanation": "2 to 4 sentence explanation",
  "action_plan": [
    {"step":"Do not click, pay, or share sensitive information","priority":"now"},
    {"step":"Verify independently using an official source","priority":"next"},
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

function normalize(a) {
  const score = Math.max(0, Math.min(100, Number(a?.risk_score) || 0));
  const level = ["LOW","MEDIUM","HIGH"].includes(a?.risk_level)
    ? a.risk_level
    : score >= 70 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";
  return {
    risk_score: score,
    risk_level: level,
    category: String(a?.category || "Other"),
    headline: String(a?.headline || "Review this content carefully."),
    why: Array.isArray(a?.why) ? a.why.slice(0,5).map(String) : [],
    explanation: String(a?.explanation || ""),
    action_plan: Array.isArray(a?.action_plan)
      ? a.action_plan.slice(0,3).map(x => ({step:String(x?.step || ""), priority:String(x?.priority || "next")}))
      : [],
    confidence: Math.max(0, Math.min(100, Number(a?.confidence) || 0))
  };
}

function heuristic(message, url, hasImage) {
  const text = (message + " " + url).toLowerCase();
  const signals = [];
  const rules = [
    [/\b(urgent|immediately|act now|within \d+ minutes?|today only|last chance|limited seats)\b/g, "Creates urgency or pressure"],
    [/(otp|one[- ]time password|pin|cvv|card number|bank details|aadhaar|pan|password)/g, "Requests sensitive personal or financial information"],
    [/(pay|payment|fee|deposit|registration fee|customs|refund).{0,45}(₹|rs\.?|inr|dollar|\$|payment|fee)/g, "Connects a request with money or a fee"],
    [/(verify|kyc|account).{0,60}(blocked|suspend|expire|deactivat)/g, "Uses account or KYC threat language"],
    [/(congratulations|selected|hired|internship|job offer).{0,80}(pay|fee|deposit|registration)/g, "Combines an opportunity claim with an upfront payment"],
    [/(https?:\/\/|www\.)/g, "Contains a link that should be verified independently"],
    [/(gift card|crypto|bitcoin|upi|qr code|wallet)/g, "Uses a payment method commonly seen in scam attempts"]
  ];
  for (const [re, signal] of rules) if (re.test(text) && !signals.includes(signal)) signals.push(signal);
  if (hasImage) signals.push("A screenshot was supplied for visual review");
  let score = Math.min(96, 8 + signals.length * 14);
  if (signals.some(s => s.includes("sensitive"))) score += 12;
  if (signals.some(s => s.includes("payment"))) score += 8;
  score = Math.min(100, score);
  const level = score >= 70 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";
  const category = /kyc|bank|account|otp|card/.test(text) ? "Bank/KYC"
    : /internship|job|hired|selected/.test(text) ? "Fake internship"
    : /delivery|parcel|customs/.test(text) ? "Fake delivery"
    : /qr|upi|wallet|payment/.test(text) ? "QR/payment scam"
    : /https?:\/\//.test(text) ? "Phishing" : "Other";
  return normalize({
    risk_score: score, risk_level: level, category,
    headline: level === "HIGH" ? "Several strong scam warning signals are present." : level === "MEDIUM" ? "There are warning signs worth verifying." : "No strong scam pattern was detected by the local checks.",
    why: signals.length ? signals : ["No strong keyword or pressure pattern was detected."],
    explanation: "This fallback scan uses transparent pattern checks. It cannot determine whether a sender or website is legitimate.",
    action_plan: [
      {step:"Do not click, pay, or share sensitive information until verified.", priority:"now"},
      {step:"Verify the sender or offer through an official website or known contact.", priority:"next"},
      {step:"Report or block the content if it remains suspicious.", priority:"later"}
    ],
    confidence: Math.min(88, 45 + signals.length * 7)
  });
}

function isSafePublicUrl(value) {
  try {
    const u = new URL(value);
    if (!["http:","https:"].includes(u.protocol)) return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h === "::1" || h === "0.0.0.0") return false;
    const ip = h.match(/^\d{1,3}(?:\.\d{1,3}){3}$/);
    if (ip) {
      const p = h.split(".").map(Number);
      if (p[0] === 10 || p[0] === 127 || (p[0] === 192 && p[1] === 168) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31)) return false;
    }
    return true;
  } catch { return false; }
}

async function inspectUrl(url) {
  if (!isSafePublicUrl(url)) return { error: "URL is not eligible for public-page inspection." };
  try {
    const r = await fetch(url, { redirect: "manual", headers: {"user-agent":"ScamShield safety checker/1.0"} });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.includes("text")) return { status:r.status, content_type:type, text:"The public page could not be read as text." };
    const html = await r.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
    return {status:r.status, final_url:url, text:text.slice(0,7000)};
  } catch {
    return {error:"Could not retrieve the public page. Continue with the URL itself and state this limitation."};
  }
}

async function groqAnalyze({message,url,image,page}) {
  const prompt = [
    message ? "MESSAGE:\n" + message : "",
    url ? "URL:\n" + url : "",
    page ? "PUBLIC PAGE SAMPLE:\n" + JSON.stringify(page) : "",
    image ? "SCREENSHOT TASK: Analyze the attached screenshot itself. Read visible text, URLs, names, logos, buttons, payment requests, warnings, sender details, and visual context. Do not require pasted OCR text. If something is unreadable, state that uncertainty rather than inventing it." : ""
  ].filter(Boolean).join("\n\n");

  const content = [{type:"text", text:prompt || "Analyze the supplied content for scam risk."}];
  if (image) {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i.exec(image);
    if (!match) throw new Error("Invalid screenshot format.");
    if (match[2].length > 3_000_000) throw new Error("Screenshot is too large. Please use a smaller screenshot.");
    content.push({type:"image_url", image_url:{url:image}});
  }

  const response = await fetch(GROQ_URL, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer " + process.env.GROQ_API_KEY
    },
    body:JSON.stringify({
      model:MODEL,
      messages:[
        {role:"system",content:SYSTEM},
        {role:"user",content}
      ],
      temperature:0.2,
      max_completion_tokens:1600,
      response_format:{type:"json_object"}
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || "Groq request failed.");
  const raw = data?.choices?.[0]?.message?.content || "";
  if (!raw) throw new Error("Groq returned no analysis.");
  return normalize(JSON.parse(cleanJson(raw)));
}

async function saveScan(inputType, content, analysis) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return;
  await fetch(process.env.SUPABASE_URL.replace(/\/$/,"") + "/rest/v1/scan_history", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "apikey":process.env.SUPABASE_SECRET_KEY,
      "Authorization":"Bearer " + process.env.SUPABASE_SECRET_KEY,
      "Prefer":"return=minimal"
    },
    body:JSON.stringify({
      input_type:inputType,
      content_preview:String(content || "").slice(0,500),
      risk_score:analysis.risk_score,
      risk_level:analysis.risk_level,
      category:analysis.category,
      result_json:analysis
    })
  });
}

export default async function handler(req,res) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok:true,
      service:"ScamShield analyze API",
      groq_configured:Boolean(process.env.GROQ_API_KEY),
      model:MODEL
    });
  }
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed."});

  try {
    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim().slice(0,12000) : "";
    const url = typeof body.url === "string" ? body.url.trim().slice(0,2000) : "";
    const image = typeof body.image === "string" ? body.image : "";

    if (image && image.length > 3_000_000) return res.status(413).json({error:"Screenshot payload is too large. Please upload a smaller screenshot."});
    if (!message && !url && !image) return res.status(400).json({error:"Paste a message, add a link, or upload a screenshot."});
    if (url && !/^https?:\/\//i.test(url)) return res.status(400).json({error:"Links must start with http:// or https://."});

    let page = null;
    if (url) page = await inspectUrl(url);

    let analysis;
    let engine = "rules";

    if (process.env.GROQ_API_KEY) {
      try {
        analysis = await groqAnalyze({message,url,image,page});
        engine = "groq";
      } catch (e) {
        console.error("Groq unavailable:", e.message);
        if (image) return res.status(502).json({error:"Screenshot AI analysis failed: " + e.message});
        analysis = heuristic(message,url,false);
      }
    } else {
      if (image) return res.status(503).json({error:"Screenshot analysis needs GROQ_API_KEY in the deployed Vercel environment."});
      analysis = heuristic(message,url,false);
    }

    const inputType = image ? "screenshot" : url ? "link" : "message";
    await saveScan(inputType, message || url || "Screenshot", analysis);

    return res.status(200).json({analysis,engine,agent_used_tools:Boolean(page)});
  } catch (e) {
    console.error(e);
    return res.status(500).json({error:e.message || "ScamShield could not complete the analysis."});
  }
}
