const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const examples={bank:"URGENT: Your bank KYC has expired. Your account will be BLOCKED today. Verify now at https://secure-kyc-update.example/login and enter your card details and OTP to avoid suspension.",job:"Congratulations! You have been selected for a remote internship. To confirm your seat, pay a refundable registration fee of ₹2,999 within 30 minutes. Send the payment screenshot and Aadhaar number to our HR WhatsApp. Limited seats!",delivery:"Your parcel could not be delivered because of an unpaid ₹49 customs fee. Pay immediately using the link below or your package will be returned: https://delivery-fee.example/pay"};
function setTheme(t){document.documentElement.classList.toggle("light",t==="light");localStorage.setItem("scamshield-theme",t);$("#themeBtn").textContent=t==="light"?"☾":"☼"}setTheme(localStorage.getItem("scamshield-theme")||"dark");$("#themeBtn").onclick=()=>setTheme(document.documentElement.classList.contains("light")?"dark":"light");
let mode="message";$$(".tab").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;$$(".tab").forEach(x=>x.classList.toggle("active",x===b));["messagePane","linkPane","screenshotPane"].forEach(id=>$("#"+id).classList.add("hidden"));$("#"+mode+"Pane").classList.remove("hidden")});
$("#messageInput").oninput=e=>$("#charCount").textContent=e.target.value.length.toLocaleString()+" / 12,000";
$$(".examples button").forEach(b=>b.onclick=()=>{$("#messageInput").value=examples[b.dataset.example];$("#messageInput").dispatchEvent(new Event("input"));mode="message";$$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.mode==="message"));["messagePane","linkPane","screenshotPane"].forEach(id=>$("#"+id).classList.add("hidden"));$("#messagePane").classList.remove("hidden");$("#messageInput").focus()});
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function localHeuristic(message,url){const text=(message+" "+url).toLowerCase();const hits=[];if(/urgent|immediately|within \d+|blocked|limited|act now/.test(text))hits.push("Urgency or pressure language");if(/otp|password|pin|cvv|card details|aadhaar/.test(text))hits.push("Sensitive credential or identity request");if(/pay|payment|fee|₹|refund|registration fee/.test(text))hits.push("Payment request or financial pressure");if(/http|login|verify|kyc|account/.test(text))hits.push("Link, login or account-verification signal");if(/bank|hr|delivery|customs|support/.test(text))hits.push("Possible organization impersonation");let score=Math.min(96,Math.max(12,25+hits.length*14+(text.length>180?8:0)));let level=score>=70?"HIGH":score>=45?"MEDIUM":"LOW";return{risk_score:score,risk_level:level,confidence:Math.min(94,62+hits.length*7),category:hits.includes("Payment request or financial pressure")?"Payment / phishing":"Suspicious message",headline:level==="HIGH"?"Multiple high-risk signals detected":level==="MEDIUM"?"Several warning signs need attention":"No strong scam pattern detected",explanation:"This demo report is based on visible signals in the content. The production AWS agent will add model reasoning, URL intelligence and community reputation.",why:hits.length?hits:["No strong warning signal was detected in this demo scan."],action_plan:[{priority:"PAUSE",step:"Do not click links or send money until you verify the sender independently."},{priority:"VERIFY",step:"Open the organization’s official app or website yourself and use its published contact details."},{priority:"REPORT",step:"If you believe this is fraud, preserve evidence and use the official reporting channel."}]}}
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
    const r=await fetch("/api/analyze",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message,url,image})
    });
    const d=await r.json();
    if(!r.ok) throw Error(d.error||"Analysis failed");
    render(d.analysis,true);
  }catch(e){
    err.textContent=e.message||"Screenshot analysis failed. Please try again.";
    err.classList.remove("hidden");
  }finally{
    btn.disabled=false;
    btn.querySelector("span").textContent="Analyze with ScamShield";
  }
}
$("#analyzeBtn").onclick=analyze;$("#newScanBtn").onclick=()=>{$("#resultSection").classList.add("hidden");location.hash="scanner"};