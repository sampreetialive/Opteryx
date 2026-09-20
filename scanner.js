const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];


const examples={bank:"URGENT: Your bank KYC has expired. Your account will be BLOCKED today. Verify now at https://secure-kyc-update.example/login and enter your card details and OTP to avoid suspension.",job:"Congratulations! You have been selected for a remote internship. To confirm your seat, pay a refundable registration fee of ₹2,999 within 30 minutes. Send the payment screenshot and Aadhaar number to our HR WhatsApp. Limited seats!",delivery:"Your parcel could not be delivered because of an unpaid ₹49 customs fee. Pay immediately using the link below or your package will be returned: https://delivery-fee.example/pay"};
function setTheme(t){document.documentElement.classList.toggle("light",t==="light");localStorage.setItem("scamshield-theme",t);const themeBtn=document.querySelector("#themeBtn");if(themeBtn)themeBtn.textContent=t==="light"?"☾":"☼"}setTheme(localStorage.getItem("scamshield-theme")||"dark");const themeBtn=document.querySelector("#themeBtn");if(themeBtn)themeBtn.onclick=()=>setTheme(document.documentElement.classList.contains("light")?"dark":"light");
let mode="message";$$(".tab").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;$$(".tab").forEach(x=>x.classList.toggle("active",x===b));["messagePane","linkPane","screenshotPane","callPane"].forEach(id=>$("#"+id)?.classList.add("hidden"));$("#"+mode+"Pane")?.classList.remove("hidden");if(mode==="call")setCallError("");});
$("#messageInput").oninput=e=>$("#charCount").textContent=e.target.value.length.toLocaleString()+" / 12,000";
$$(".examples button").forEach(b=>b.onclick=()=>{$("#messageInput").value=examples[b.dataset.example];$("#messageInput").dispatchEvent(new Event("input"));mode="message";$$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.mode==="message"));["messagePane","linkPane","screenshotPane","callPane"].forEach(id=>$("#"+id)?.classList.add("hidden"));$("#messagePane").classList.remove("hidden");$("#messageInput").focus()});
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function localHeuristic(message,url){const text=(message+" "+url).toLowerCase();const hits=[];if(/urgent|immediately|within \d+|blocked|limited|act now/.test(text))hits.push("Urgency or pressure language");if(/otp|password|pin|cvv|card details|aadhaar/.test(text))hits.push("Sensitive credential or identity request");if(/pay|payment|fee|₹|refund|registration fee/.test(text))hits.push("Payment request or financial pressure");if(/http|login|verify|kyc|account/.test(text))hits.push("Link, login or account-verification signal");if(/bank|hr|delivery|customs|support/.test(text))hits.push("Possible organization impersonation");let score=Math.min(96,Math.max(12,25+hits.length*14+(text.length>180?8:0)));let level=score>=70?"HIGH":score>=45?"MEDIUM":"LOW";return{risk_score:score,risk_level:level,confidence:Math.min(94,62+hits.length*7),category:hits.includes("Payment request or financial pressure")?"Payment / phishing":"Suspicious message",headline:level==="HIGH"?"Multiple high-risk signals detected":level==="MEDIUM"?"Several warning signs need attention":"No strong scam pattern detected",explanation:"This demo report is based on visible signals in the content. The AI backend adds model reasoning, URL intelligence and community reputation.",why:hits.length?hits:["No strong warning signal was detected in this demo scan."],action_plan:[{priority:"PAUSE",step:"Do not click links or send money until you verify the sender independently."},{priority:"VERIFY",step:"Open the organization’s official app or website yourself and use its published contact details."},{priority:"REPORT",step:"If you believe this is fraud, preserve evidence and use the official reporting channel."}]}}
function backendUrl(action){
  const base=String(window.SCAMSHIELD_CONFIG?.supabaseFunctionUrl||"").trim().replace(/\/+$/,"");
  return base ? base+"?action="+encodeURIComponent(action) : "";
}
function render(a,community=true){const score=Number(a.risk_score)||0,col=a.risk_level==="HIGH"?"var(--red)":a.risk_level==="LOW"?"var(--green)":"var(--yellow)";$("#resultCard").innerHTML=`<div class="report-main"><div class="risk-ring" style="--score:${score};--risk:${col}"><div class="risk-inner"><div class="risk-score">${score}</div><div class="risk-label">risk score</div></div></div><div><div class="chips"><span class="chip" style="color:${col}">${esc(a.risk_level)} RISK</span><span class="chip">${esc(a.category)}</span><span class="chip">${Number(a.confidence)||0}% confidence</span></div><div class="risk-title">${esc(a.headline)}</div><p style="color:var(--muted);font-size:12px;line-height:1.6">${esc(a.explanation)}</p></div></div><div class="report-block"><h4>WHY IT LOOKS SUSPICIOUS</h4><div class="why-grid">${(a.why||[]).map(x=>`<div class="why-item"><b>⚠ SIGNAL</b>${esc(x)}</div>`).join("")}</div></div><div class="report-block"><h4>SAFE ACTION PLAN</h4><div class="action-grid">${(a.action_plan||[]).map((x,i)=>`<div class="action-item"><b>${i+1}. ${esc(x.priority)}</b>${esc(x.step)}</div>`).join("")}</div></div>${community?'<div class="community-box"><strong>🚩 Community signal</strong><p>This demo shows how historical reports will appear. Production values will come from the ScamShield report database, not hardcoded counts.</p><b>View report history →</b></div>':""}<p style="color:var(--muted);font-size:9px;margin-top:17px">AI-assisted analysis is a warning signal, not proof. Verify independently.</p>`;$("#resultSection").classList.remove("hidden");$("#resultSection").scrollIntoView({behavior:"smooth"})}
function readImage(file){
  return new Promise((resolve,reject)=>{
    if(!file) return resolve(null);
    if(!/^image\/(png|jpeg|webp)$/i.test(file.type)) return reject(new Error("Please choose a PNG, JPG, or WebP screenshot."));
    if(file.size>8*1024*1024) return reject(new Error("Please keep screenshots under 8 MB."));
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const maxSide=1600;
        const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const dataUrl=canvas.toDataURL("image/jpeg",0.78);
        if(dataUrl.length>3_000_000) return reject(new Error("That screenshot is still too large. Try a smaller screenshot."));
        resolve(dataUrl);
      };
      img.onerror=()=>reject(new Error("The screenshot could not be decoded."));
      img.src=String(reader.result);
    };
    reader.onerror=()=>reject(new Error("Could not read that screenshot."));
    reader.readAsDataURL(file);
  });
}
$("#fileInput").onchange=e=>{
  const f=e.target.files[0];
  $("#fileName").textContent=f?f.name+" · "+Math.round(f.size/1024)+" KB":"No image selected";
};
async function analyze(){
  const btn=$("#analyzeBtn"),err=$("#errorBox");
  if(!btn||!err)return;
  err.classList.add("hidden");
  let message="",url="",image=null;
  if(mode==="message") message=$("#messageInput").value.trim();
  if(mode==="link") url=$("#urlInput").value.trim();
  if(mode==="screenshot"){
    try{ image=await readImage($("#fileInput").files[0]); }
    catch(e){ err.textContent=e.message;err.classList.remove("hidden");return; }
  }
  if(!message&&!url&&!image){
    err.textContent=mode==="screenshot"?"Choose a screenshot first.":"Add something to analyze first.";
    err.classList.remove("hidden");return;
  }
  btn.disabled=true;
  btn.querySelector("span").textContent="AI is analyzing…";
  try{
    const backend=backendUrl("analyze");
    if(!backend){
      if(image){
        throw new Error("Screenshot AI needs the Supabase backend. Add the Supabase function URL to config.js first.");
      }
      render(localHeuristic(message,url),false);
      return;
    }
    const r=await fetch(backend,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message,url,image})
    });
    const contentType=r.headers.get("content-type")||"";
    if(!contentType.includes("application/json")){
      const raw=await r.text();
      if(/<html|<!doctype/i.test(raw)){
        throw Error("The ScamShield backend returned HTML instead of JSON. Check the Supabase function URL in config.js.");
      }
      throw Error("The analysis server returned an unexpected response.");
    }
    const d=await r.json();
    if(!r.ok) throw Error(d.error||"Analysis failed");
    render(d.analysis,true);
  }catch(e){
    if(mode!=="screenshot" || message){ render(localHeuristic(message,url),true); return; }
    err.textContent=e.message||"Screenshot analysis failed. Please try again.";
    err.classList.remove("hidden");
  }finally{
    btn.disabled=false;
    btn.querySelector("span").textContent="Analyze with ScamShield";
  }
}

let callRecognition=null;
let callRunning=false;
let callStartedAt=0;
let callTimerId=null;
let callBuffer="";
let lastCallAnalysis="";
let callAnalysisBusy=false;
let callRestarting=false;

function setCallError(message){
  const el=$("#callError");
  if(!el)return;
  if(message){el.textContent=message;el.classList.remove("hidden");}
  else el.classList.add("hidden");
}

function setCallStatus(label,kind){
  const el=$("#callStatus");
  if(!el)return;
  el.textContent=label;
  el.className="call-status"+(kind?" "+kind:"");
}

function updateCallTimer(){
  if(!callStartedAt)return;
  const seconds=Math.floor((Date.now()-callStartedAt)/1000);
  const mm=String(Math.floor(seconds/60)).padStart(2,"0");
  const ss=String(seconds%60).padStart(2,"0");
  if($("#callTimer"))$("#callTimer").textContent=mm+":"+ss;
}

function setCallButtons(running){
  if($("#startCallBtn"))$("#startCallBtn").disabled=running;
  if($("#stopCallBtn"))$("#stopCallBtn").disabled=!running;
}

function clearCallView(){
  callBuffer="";lastCallAnalysis="";
  if($("#callTranscript"))$("#callTranscript").innerHTML='<span class="transcript-placeholder">Your live transcript will appear here…</span>';
  if($("#callRisk")){$("#callRisk").className="call-risk neutral";$("#callRisk").textContent="WAITING";}
  if($("#callRiskText"))$("#callRiskText").textContent="Start the scan to monitor the conversation for common scam patterns.";
  if($("#callConfidence"))$("#callConfidence").textContent="—";
  if($("#callSignals"))$("#callSignals").innerHTML="<span>No signals yet</span>";
  if($("#callTimer"))$("#callTimer").textContent="00:00";
  setCallError("");
}

function addTranscript(text){
  const el=$("#callTranscript");
  if(!el||!text)return;
  const placeholder=el.querySelector(".transcript-placeholder");
  if(placeholder)placeholder.remove();
  el.textContent=(el.textContent+" "+text).trim().slice(-12000);
  el.scrollTop=el.scrollHeight;
}

function showCallAnalysis(a){
  if(!a)return;
  const level=String(a.risk_level||"LOW").toUpperCase();
  const cls=level==="HIGH"?"high":level==="MEDIUM"?"medium":"low";
  const title=level==="HIGH"?"POTENTIAL SCAM":level==="MEDIUM"?"SUSPICIOUS":"NO MAJOR SIGNAL";
  $("#callRisk").className="call-risk "+cls;
  $("#callRisk").textContent=title;
  $("#callConfidence").textContent=(Number(a.confidence)||0)+"%";
  $("#callRiskText").textContent=String(a.headline||a.explanation||"Review the conversation carefully.");
  const signals=Array.isArray(a.why)?a.why.slice(0,4):[];
  $("#callSignals").innerHTML=(signals.length?signals:["No strong warning signal detected."]).map(x=>"<span>"+esc(x)+"</span>").join("");
}

async function analyzeCallTranscript(text){
  const clean=String(text||"").trim();
  if(clean.length<25||clean===lastCallAnalysis||callAnalysisBusy)return;
  const backend=backendUrl("analyze");
  if(!backend)return;
  callAnalysisBusy=true;
  lastCallAnalysis=clean;
  setCallStatus("ANALYZING","analyzing");
  try{
    const r=await fetch(backend,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"LIVE CALL TRANSCRIPT:\n"+clean.slice(-8000)})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||"Live call analysis failed.");
    showCallAnalysis(d.analysis);
  }catch(e){
    setCallError(e.message||"Live call analysis failed. The transcript will continue locally.");
  }finally{
    callAnalysisBusy=false;
    if(callRunning)setCallStatus("LIVE","live");
  }
}

function stopCallScan(){
  callRunning=false;
  callRestarting=false;
  if(callRecognition){try{callRecognition.stop();}catch(_){}}
  if(callTimerId)clearInterval(callTimerId);
  callTimerId=null;
  setCallButtons(false);
  setCallStatus("STOPPED","");
}

function startCallScan(){
  setCallError("");
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    setCallError("Live transcription is not supported by this browser. Please use the latest Chrome or Edge, or use the Message tab with a call transcript.");
    return;
  }
  if(callRunning)return;
  callRunning=true;callRestarting=false;callStartedAt=Date.now();callBuffer="";
  clearCallView();callStartedAt=Date.now();
  setCallButtons(true);setCallStatus("LIVE","live");
  callTimerId=setInterval(updateCallTimer,1000);
  callRecognition=new SpeechRecognition();
  callRecognition.continuous=true;
  callRecognition.interimResults=true;
  callRecognition.lang=navigator.language||"en-IN";
  callRecognition.maxAlternatives=1;
  callRecognition.onresult=e=>{
    let finalText="";
    let interim="";
    for(let i=e.resultIndex;i<e.results.length;i++){
      const part=e.results[i][0].transcript;
      if(e.results[i].isFinal)finalText+=" "+part;
      else interim+=" "+part;
    }
    if(finalText){
      callBuffer=(callBuffer+" "+finalText).trim().slice(-10000);
      addTranscript(finalText.trim());
      analyzeCallTranscript(callBuffer);
    }
    if(interim&&$("#callStatus")&&callRunning)$("#callStatus").title="Hearing: "+interim.trim();
  };
  callRecognition.onerror=e=>{
    if(!callRunning)return;
    if(e.error==="not-allowed"||e.error==="service-not-allowed"){
      stopCallScan();
      setCallError("Microphone/speech permission was denied. Allow microphone access and try again.");
      return;
    }
    if(e.error==="no-speech")return;
    setCallError("Speech recognition reported: "+e.error+". The scan can be restarted.");
  };
  callRecognition.onend=()=>{
    if(callRunning&&!callRestarting){
      callRestarting=true;
      setTimeout(()=>{
        callRestarting=false;
        if(callRunning)try{callRecognition.start();}catch(_){}
      },250);
    }
  };
  try{callRecognition.start();}catch(e){stopCallScan();setCallError("Could not start live transcription. Please allow microphone access and try again.");}
}

$("#startCallBtn")?.addEventListener("click",startCallScan);
$("#stopCallBtn")?.addEventListener("click",stopCallScan);
$("#clearCallBtn")?.addEventListener("click",()=>{if(callRunning)stopCallScan();clearCallView();setCallStatus("READY","");});

$("#analyzeBtn").onclick=analyze;$("#newScanBtn").onclick=()=>{$("#resultSection").classList.add("hidden");location.hash="scanner"};
