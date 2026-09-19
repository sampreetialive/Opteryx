const ORIGIN = "https://sampreetialive.github.io";
const MODEL = Deno.env.get("GROQ_MODEL") || "qwen/qwen3.6-27b";
const MODEL_FALLBACKS = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"];
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const requests = new Map();

function cors(req) {
  const origin = req.headers.get("origin") || "";
  const allowed = String(Deno.env.get("SCAMSHIELD_ALLOWED_ORIGINS") || ORIGIN)
    .split(",")
    .map(function (x) { return x.trim(); })
    .filter(Boolean);

  const headers = {
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Vary": "Origin"
  };

  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function json(req, body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({}, cors(req), {
      "Content-Type": "application/json"
    })
  });
}

function rateOk(req) {
  const key = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const now = Date.now();
  const bucket = requests.get(key) || { count: 0, reset: now + 60000 };

  if (bucket.reset <= now) {
    bucket.count = 0;
    bucket.reset = now + 60000;
  }

  bucket.count += 1;
  requests.set(key, bucket);
  return bucket.count <= 20;
}

function cleanJson(raw) {
  let text = String(raw || "").trim();

  if (text.startsWith("~~~") || text.startsWith("```")) {
    const newline = text.indexOf("\n");
    if (newline >= 0) text = text.slice(newline + 1);
    const fence = text.lastIndexOf("```");
    if (fence >= 0) text = text.slice(0, fence);
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

function normalize(value) {
  const score = Math.max(0, Math.min(100, Number(value && value.risk_score) || 0));
  const level = ["LOW", "MEDIUM", "HIGH"].includes(value && value.risk_level)
    ? value.risk_level
    : score >= 70 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";

  return {
    risk_score: score,
    risk_level: level,
    category: String((value && value.category) || "Other"),
    headline: String((value && value.headline) || "Review this content carefully."),
    why: Array.isArray(value && value.why) ? value.why.slice(0, 5).map(String) : [],
    explanation: String((value && value.explanation) || ""),
    action_plan: Array.isArray(value && value.action_plan)
      ? value.action_plan.slice(0, 3).map(function (item) {
          return {
            step: String((item && item.step) || ""),
            priority: String((item && item.priority) || "next")
          };
        })
      : [],
    confidence: Math.max(0, Math.min(100, Number(value && value.confidence) || 0))
  };
}

function heuristic(message, url) {
  const text = (String(message || "") + " " + String(url || "")).toLowerCase();
  const signals = [];
  const rules = [
    [/(urgent|immediately|act now|within \d+ minutes?|limited seats)/, "Creates urgency or pressure"],
    [/(otp|password|pin|cvv|card number|bank details|aadhaar|pan)/, "Requests sensitive information"],
    [/(pay|payment|fee|deposit|registration fee|customs|refund)/, "Uses a payment or fee request"],
    [/(verify|kyc|account).{0,60}(blocked|suspend|expire|deactivat)/, "Uses account or KYC threat language"],
    [/(https?:\/\/|www\.)/, "Contains a link that should be verified independently"]
  ];

  for (const pair of rules) {
    if (pair[0].test(text) && !signals.includes(pair[1])) signals.push(pair[1]);
  }

  const score = Math.min(100, 10 + signals.length * 18);
  const level = score >= 70 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";

  return normalize({
    risk_score: score,
    risk_level: level,
    category: /kyc|bank|account|otp/.test(text)
      ? "Bank/KYC"
      : /internship|job/.test(text)
        ? "Fake internship"
        : /delivery|parcel/.test(text)
          ? "Fake delivery"
          : /https?:\/\//.test(text)
            ? "Phishing"
            : "Other",
    headline: level === "HIGH"
      ? "Several strong scam warning signals are present."
      : level === "MEDIUM"
        ? "There are warning signs worth verifying."
        : "No strong scam pattern was detected by the local checks.",
    why: signals.length ? signals : ["No strong warning signal was detected."],
    explanation: "This fallback uses transparent pattern checks. It cannot establish whether a sender or website is legitimate.",
    action_plan: [
      { step: "Do not click, pay, or share sensitive information until verified.", priority: "now" },
      { step: "Verify independently using an official website or known contact.", priority: "next" },
      { step: "Report or block the content if it remains suspicious.", priority: "later" }
    ],
    confidence: Math.min(88, 45 + signals.length * 7)
  });
}

async function inspectUrl(url) {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { error: "Unsupported URL protocol." };
    }

    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return { error: "The URL is not eligible for public-page inspection." };
    }

    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "ScamShield safety checker/1.0" }
    });

    const type = response.headers.get("content-type") || "";
    const location = response.headers.get("location") || "";

    if (response.status >= 300 && response.status < 400) {
      return {
        status: response.status,
        redirected_to: location || null,
        text: "The page returned a redirect; ScamShield did not follow it automatically."
      };
    }

    if (!response.ok || !/^text\//i.test(type)) {
      return {
        status: response.status,
        text: "The public page could not be read as text."
      };
    }

    const html = (await response.text()).slice(0, 120000);
    const text = html
      .replace(/<[^>]+>/g, " ")
      .split(" ")
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      status: response.status,
      text: text.slice(0, 7000)
    };
  } catch (_error) {
    return {
      error: "Could not retrieve the public page. Continue with the URL itself and state this limitation."
    };
  }
}

async function groqAnalyze(message, url, image, page) {
  const content = [
    {
      type: "text",
      text: [
        message ? "MESSAGE:\n" + message : "",
        url ? "URL:\n" + url : "",
        page ? "PUBLIC PAGE SAMPLE:\n" + JSON.stringify(page) : "",
        image ? "SCREENSHOT: inspect the image itself; read visible text, sender details, URLs, buttons, payment requests and warning signs. Do not invent unreadable details." : ""
      ].filter(Boolean).join("\n\n") || "Analyze the supplied content for scam risk."
    }
  ];

  if (image) {
    if (!/^data:image\\/(png|jpeg|webp);base64,/i.test(image)) {
      throw new Error("Invalid screenshot format.");
    }
    if (image.length > 3000000) {
      throw new Error("Screenshot is too large.");
    }
    content.push({
      type: "image_url",
      image_url: { url: image }
    });
  }

  const candidates = [MODEL].concat(MODEL_FALLBACKS).filter(function (model, index, list) {
    return model && list.indexOf(model) === index;
  });

  let lastError = "Groq request failed.";

  for (const model of candidates) {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + Deno.env.get("GROQ_API_KEY")
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are ScamShield, a careful scam-awareness AI. Analyze suspicious messages, links and screenshots using concrete evidence. Never request or repeat passwords, OTPs, PINs, CVVs, card numbers or private keys. Do not claim certainty. Return ONLY JSON with risk_score, risk_level (LOW|MEDIUM|HIGH), category, headline, why (array), explanation, action_plan (array of {step,priority}), and confidence."
          },
          { role: "user", content: content }
        ],
        temperature: 0.2,
        max_completion_tokens: 1400,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json().catch(function () { return {}; });

    if (!response.ok) {
      lastError =
        data && data.error && data.error.message
          ? data.error.message
          : "Groq request failed.";

      if (response.status !== 403 && response.status !== 404) {
        throw new Error(lastError);
      }

      continue;
    }

    const raw =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message
        ? data.choices[0].message.content
        : "";

    if (!raw) {
      lastError = "Groq returned no analysis.";
      continue;
    }

    return normalize(JSON.parse(cleanJson(raw)));
  }

  throw new Error(
    lastError +
    " ScamShield tried both supported Qwen vision models. Check Groq model permissions for the organization/project."
  );
}
Deno.serve(async function (req) {
  const origin = req.headers.get("origin") || "";

  if (origin && !String(Deno.env.get("SCAMSHIELD_ALLOWED_ORIGINS") || ORIGIN).split(",").map(function (x) { return x.trim(); }).includes(origin)) {
    return json(req, { error: "Origin not allowed." }, 403);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(req) });
  }

  if (!rateOk(req)) {
    return json(req, { error: "Too many requests. Please wait a minute and try again." }, 429);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "health";

  if (req.method === "GET" && action === "health") {
    return json(req, {
      ok: true,
      service: "ScamShield Supabase Edge Function",
      groq_configured: Boolean(Deno.env.get("GROQ_API_KEY")),
      model: MODEL
    });
  }

  if (req.method !== "POST" || action !== "analyze") {
    return json(req, { error: "Not found." }, 404);
  }

  try {
    const body = await req.json().catch(function () { return {}; });
    const message = typeof body.message === "string"
      ? body.message.trim().slice(0, 12000)
      : "";
    const suppliedUrl = typeof body.url === "string"
      ? body.url.trim().slice(0, 2000)
      : "";
    const image = typeof body.image === "string" ? body.image : "";

    if (image && image.length > 3000000) {
      return json(req, { error: "Screenshot payload is too large." }, 413);
    }

    if (!message && !suppliedUrl && !image) {
      return json(req, { error: "Paste a message, add a link, or upload a screenshot." }, 400);
    }

    if (suppliedUrl && !/^https?:\/\//i.test(suppliedUrl)) {
      return json(req, { error: "Links must start with http:// or https://." }, 400);
    }

    const page = suppliedUrl ? await inspectUrl(suppliedUrl) : null;
    let analysis;
    let engine = "rules";

    if (Deno.env.get("GROQ_API_KEY")) {
      try {
        analysis = await groqAnalyze(message, suppliedUrl, image, page);
        engine = "groq";
      } catch (error) {
        console.error("Groq unavailable:", error.message);
        if (image && !message) {
          return json(req, { error: "Screenshot AI analysis failed: " + error.message }, 502);
        }
        analysis = heuristic(message, suppliedUrl);
      }
    } else {
      if (image && !message) {
        return json(req, { error: "Screenshot AI analysis needs GROQ_API_KEY in Supabase Edge Function secrets." }, 503);
      }
      analysis = heuristic(message, suppliedUrl);
    }

    return json(req, {
      analysis: analysis,
      engine: engine,
      agent_used_tools: Boolean(page && !page.error)
    });
  } catch (error) {
    console.error(error);
    return json(req, {
      error: error.message || "ScamShield could not complete the analysis."
    }, 500);
  }
});
