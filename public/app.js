const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const examples = {
  internship: "Congratulations! You have been selected for a remote internship at a leading company. To confirm your seat, pay a refundable registration fee of ₹2,999 within 30 minutes. Send the payment screenshot and your Aadhaar number to our HR WhatsApp. Limited seats!",
  bank: "URGENT: Your bank KYC has expired. Your account will be BLOCKED today. Verify now at https://secure-kyc-update.example/login and enter your card details and OTP to avoid suspension.",
  delivery: "Your parcel could not be delivered because of an unpaid ₹49 customs fee. Pay immediately using the link below or your package will be returned: https://delivery-fee.example/pay"
};

function setTheme(theme){
  document.documentElement.classList.toggle("light", theme === "light");
  localStorage.setItem("scamshield-theme", theme);
  $("#themeBtn").textContent = theme === "light" ? "☾" : "☼";
}
setTheme(localStorage.getItem("scamshield-theme") || "dark");
$("#themeBtn").onclick = () => setTheme(document.documentElement.classList.contains("light") ? "dark" : "light");

let mode = "message";
$$(".tab").forEach(btn => btn.onclick = () => {
  mode = btn.dataset.mode;
  $$(".tab").forEach(x => x.classList.toggle("active", x === btn));
  ["messagePane","linkPane","screenshotPane"].forEach(id => $("#" + id).classList.add("hidden"));
  $("#" + mode + "Pane").classList.remove("hidden");
});

$("#messageInput").addEventListener("input", e => $("#charCount").textContent = e.target.value.length.toLocaleString() + " / 12,000");
$$(".examples button").forEach(btn => btn.onclick = () => {
  const value = examples[btn.dataset.example];
  mode = "message";
  $$(".tab").forEach(x => x.classList.toggle("active", x.dataset.mode === "message"));
  ["messagePane","linkPane","screenshotPane"].forEach(id => $("#" + id).classList.add("hidden"));
  $("#messagePane").classList.remove("hidden");
  $("#messageInput").value = value;
  $("#messageInput").dispatchEvent(new Event("input"));
  $("#messageInput").focus();
});

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function riskColor(level){
  return level === "HIGH" ? "var(--red)" : level === "LOW" ? "var(--green)" : "var(--yellow)";
}

function renderResult(a, agentUsedTools, engine){
  const score = Number(a.risk_score) || 0;
  const color = riskColor(a.risk_level);
  const why = Array.isArray(a.why) ? a.why : [];
  const actions = Array.isArray(a.action_plan) ? a.action_plan : [];
  $("#resultCard").innerHTML = `
    <div class="result-main">
      <div class="risk-ring" style="--score:${score};--risk:${color}">
        <div class="risk-ring-inner"><div class="risk-score">${score}</div><div class="risk-label">risk score</div></div>
      </div>
      <div class="risk-copy">
        <div class="risk-meta">
          <span class="risk-chip" style="color:${color}">${escapeHtml(a.risk_level || "MEDIUM")} RISK</span>
          <span class="risk-chip">${escapeHtml(a.category || "Other")}</span>
          <span class="risk-chip">${Number(a.confidence) || 0}% confidence</span>
        </div>
        <h3>${escapeHtml(a.headline || "Review this message carefully.")}</h3>
        <p class="explanation">${escapeHtml(a.explanation || "")}</p>
      </div>
    </div>
    <div class="why">
      <h4>WHY IT LOOKS SUSPICIOUS</h4>
      <ul>${why.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    </div>
    <div class="action">
      <h4>SAFE ACTION PLAN</h4>
      <div class="actions">${actions.slice(0,3).map((x,i) => `<div class="action-item"><b>${i+1}. ${escapeHtml(x.priority || "NEXT").toUpperCase()}</b><p>${escapeHtml(x.step || "")}</p></div>`).join("")}</div>
    </div>
    <div class="agent-note">✦ <strong>${engine === "gemini" ? "AI agent:" : "Local safety engine:"}</strong> ${agentUsedTools ? "ScamShield inspected the supplied public link before completing this report." : engine === "gemini" ? "Gemini analyzed the supplied content and returned a structured safety report." : "This scan used the built-in rule engine because no AI key is configured yet."}</div>
  `;
  $("#resultSection").classList.remove("hidden");
  $("#resultSection").scrollIntoView({behavior:"smooth", block:"start"});
}

function readImage(file){
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!/^image\\/(png|jpeg|webp)$/i.test(file.type)) return reject(new Error("Please choose a PNG, JPG, or WebP image."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Please keep screenshots under 8 MB."));

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        if (dataUrl.length > 5_000_000) return reject(new Error("That screenshot is still too large after compression. Try a smaller image."));
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Could not decode that screenshot."));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read that screenshot."));
    reader.readAsDataURL(file);
  });
}

function setScreenshot(file){
  if (!file) return;
  $("#fileName").textContent = file.name + " · " + Math.round(file.size / 1024) + " KB";
  const preview = $("#imagePreview");
  preview.src = URL.createObjectURL(file);
  preview.classList.remove("hidden");
}

$("#fileInput").addEventListener("change", e => setScreenshot(e.target.files[0]));
$("#dropzone").addEventListener("dragover", e => { e.preventDefault(); $("#dropzone").classList.add("dragging"); });
$("#dropzone").addEventListener("dragleave", () => $("#dropzone").classList.remove("dragging"));
$("#dropzone").addEventListener("drop", e => {
  e.preventDefault();
  $("#dropzone").classList.remove("dragging");
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const input = $("#fileInput");
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    setScreenshot(file);
  } catch {
    setScreenshot(file);
  }
});

function saveLocalScan(analysis, content){
  const scans = JSON.parse(localStorage.getItem("scamshield-local-history") || "[]");
  scans.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    input_type: mode === "link" ? "link" : mode === "screenshot" ? "screenshot" : "message",
    content_preview: String(content || "").slice(0, 500),
    risk_score: analysis.risk_score,
    risk_level: analysis.risk_level,
    category: analysis.category,
    created_at: new Date().toISOString()
  });
  localStorage.setItem("scamshield-local-history", JSON.stringify(scans.slice(0, 8)));
}

async function analyze(){
  const btn = $("#analyzeBtn"), error = $("#errorBox");
  error.classList.add("hidden");
  let message = "", url = "", image = null;
  if (mode === "message") message = $("#messageInput").value.trim();
  if (mode === "link") url = $("#urlInput").value.trim();
  if (mode === "screenshot") {
    message = $("#ocrInput").value.trim();
    try { image = await readImage($("#fileInput").files[0]); } catch(e) {
      error.textContent = e.message; error.classList.remove("hidden"); return;
    }
  }

  if (!message && !url && !image){
    error.textContent = "Add something to analyze first.";
    error.classList.remove("hidden");
    return;
  }

  btn.disabled = true;
  btn.querySelector("span").textContent = "Agent is analyzing…";
  try{
    const r = await fetch("/api/analyze", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message,url,image})
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Analysis failed.");
    renderResult(data.analysis, data.agent_used_tools, data.engine);
    saveLocalScan(data.analysis, message || url || "Screenshot");
    loadHistory();
  }catch(e){
    error.textContent = e.message || "Something went wrong. Please try again.";
    error.classList.remove("hidden");
  }finally{
    btn.disabled = false;
    btn.querySelector("span").textContent = "Analyze with ScamShield";
  }
}
$("#analyzeBtn").onclick = analyze;
$("#newScanBtn").onclick = () => { $("#resultSection").classList.add("hidden"); window.scrollTo({top:0,behavior:"smooth"}); };
$("#refreshHistory").onclick = loadHistory;

function formatTime(v){
  try{return new Date(v).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});}catch{return "";}
}

function renderHistory(scans){
  if (!scans?.length) {
    $("#historyGrid").innerHTML = '<div class="empty-history">Your recent checks will appear here.</div>';
    return;
  }
  $("#historyGrid").innerHTML = scans.map(s => {
    const color = riskColor(s.risk_level);
    return `<div class="history-item">
      <div class="history-top"><span class="history-risk" style="color:${color}">${escapeHtml(s.risk_level)}</span><span class="history-score">${s.risk_score}</span></div>
      <div class="history-cat">${escapeHtml(s.category)}</div>
      <div class="history-preview">${escapeHtml(s.content_preview)}</div>
      <div class="history-time">${formatTime(s.created_at)}</div>
    </div>`;
  }).join("");
}

async function loadHistory(){
  try{
    const r = await fetch("/api/history");
    const data = await r.json();
    if (data.scans?.length) return renderHistory(data.scans);
  }catch(e){}
  renderHistory(JSON.parse(localStorage.getItem("scamshield-local-history") || "[]"));
}
loadHistory();