const authById=id=>document.getElementById(id);

let authClient=null;
let authMode="signup";

function showAuthNotice(message,type="info"){
  const box=authById("authMessage");
  if(!box)return;
  box.textContent=message;
  box.className="auth-message "+type;
  box.classList.remove("hidden");
}

function setAuthMode(next){
  authMode=next;
  const signup=next==="signup";
  authById("signupTab").classList.toggle("active",signup);
  authById("loginTab").classList.toggle("active",!signup);
  authById("nameField").classList.toggle("hidden",!signup);
  authById("authTitle").textContent=signup?"Create your account":"Welcome back";
  authById("authSubtitle").textContent=signup
    ?"Sign up to access the ScamShield security console."
    :"Sign in to continue to your ScamShield security console.";
  authById("authSubmit").querySelector("span").textContent=signup?"Create account":"Sign in";
  authById("authPassword").setAttribute("autocomplete",signup?"new-password":"current-password");
  authById("authMessage").classList.add("hidden");
}

function showProtectedApp(user){
  const signedIn=Boolean(user);
  authById("authGate").classList.toggle("hidden",signedIn);
  authById("appShell").classList.toggle("hidden",!signedIn);

  if(signedIn){
    const email=String(user.email||"");
    const name=String(user.user_metadata?.display_name||user.user_metadata?.name||"").trim();
    authById("userBadge").textContent=name?name+" · "+email:email;
  }else{
    authById("userBadge").textContent="";
  }
}

function setupAuth(){
  const config=window.SCAMSHIELD_CONFIG||{};
  const url=String(config.supabaseUrl||"").trim();
  const key=String(config.supabaseAnonKey||"").trim();

  if(!window.supabase){
    showAuthNotice("Supabase Auth could not load. Refresh the page and try again.","error");
    return;
  }

  if(!url||!key||key.includes("YOUR_SUPABASE_")){
    showAuthNotice("Authentication is not configured yet. Add the Supabase publishable/anon key to config.js.","error");
    return;
  }

  if(key.includes("service_role")||key.startsWith("sb_secret_")){
    showAuthNotice("That is a Supabase secret key. Use the browser-safe publishable/anon key instead.","error");
    return;
  }

  try{
    authClient=window.supabase.createClient(url,key,{
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true
      }
    });

    authClient.auth.getSession().then(({data,error})=>{
      if(error)throw error;
      showProtectedApp(data.session?.user||null);
    }).catch(error=>{
      showAuthNotice(error.message||"Could not restore your session.","error");
    });

    authClient.auth.onAuthStateChange((_event,session)=>{
      showProtectedApp(session?.user||null);
    });
  }catch(error){
    showAuthNotice(error.message||"Supabase Auth could not be initialized.","error");
  }
}

authById("signupTab").onclick=()=>setAuthMode("signup");
authById("loginTab").onclick=()=>setAuthMode("login");

authById("togglePassword").onclick=()=>{
  const input=authById("authPassword");
  const showing=input.type==="text";
  input.type=showing?"password":"text";
  authById("togglePassword").textContent=showing?"Show":"Hide";
  authById("togglePassword").setAttribute("aria-label",showing?"Show password":"Hide password");
};

authById("authThemeBtn").onclick=()=>{
  if(typeof setTheme==="function"){
    setTheme(document.documentElement.classList.contains("light")?"dark":"light");
  }
};

authById("authForm").onsubmit=async event=>{
  event.preventDefault();

  if(!authClient){
    showAuthNotice("Authentication is not connected yet. Add the Supabase publishable/anon key to config.js and refresh.","error");
    return;
  }

  const email=authById("authEmail").value.trim();
  const password=authById("authPassword").value;
  const name=authById("authName").value.trim();
  const submit=authById("authSubmit");

  submit.disabled=true;
  submit.querySelector("span").textContent=authMode==="signup"?"Creating account…":"Signing in…";
  authById("authMessage").classList.add("hidden");

  try{
    if(authMode==="signup"){
      const {data,error}=await authClient.auth.signUp({
        email,
        password,
        options:{data:{display_name:name}}
      });

      if(error)throw error;

      if(data.session){
        showAuthNotice("Account created. You're signed in.","success");
      }else{
        showAuthNotice("Account created. Check your email to confirm the account, then use Sign in.","success");
      }
    }else{
      const {data,error}=await authClient.auth.signInWithPassword({email,password});
      if(error)throw error;
      if(data.user)showProtectedApp(data.user);
    }
  }catch(error){
    showAuthNotice(error.message||"Authentication failed. Please try again.","error");
  }finally{
    submit.disabled=false;
    submit.querySelector("span").textContent=authMode==="signup"?"Create account":"Sign in";
  }
};

authById("logoutBtn").onclick=async()=>{
  if(!authClient)return;
  const {error}=await authClient.auth.signOut();
  if(error){
    showAuthNotice(error.message||"Could not sign out.","error");
    return;
  }
  setAuthMode("login");
  authById("authPassword").value="";
  authById("authEmail").focus();
};

setAuthMode("signup");
setupAuth();
