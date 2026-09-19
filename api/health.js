const DEFAULT_CORS_ORIGIN="https://sampreetialive.github.io";
function applyCors(req,res){
  const origin=String(req?.headers?.origin||"");
  const allowed=String(process.env.CORS_ORIGINS||DEFAULT_CORS_ORIGIN).split(",").map(x=>x.trim()).filter(Boolean);
  const vercelOrigin=process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "";
  if(origin&&(allowed.includes(origin)||origin===vercelOrigin)) res.setHeader("Access-Control-Allow-Origin",origin);
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
}
export default function handler(req,res){
  applyCors(req,res);
  if(req.method==="OPTIONS") return res.status(204).end();
  res.status(200).json({
    ok:true,
    service:"ScamShield API",
    groq_configured:Boolean(process.env.GROQ_API_KEY),
    groq_model:process.env.GROQ_MODEL||"qwen/qwen3.6-27b",
    supabase_configured:Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY)
  });
}
