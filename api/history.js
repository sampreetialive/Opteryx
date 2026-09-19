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
export default async function handler(req,res){
  applyCors(req,res);
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed."});
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY) return res.status(200).json({scans:[]});
  try{
    const base=process.env.SUPABASE_URL.replace(/\/$/,"");
    const url=base+"/rest/v1/scan_history?select=id,input_type,content_preview,risk_score,risk_level,category,created_at&order=created_at.desc&limit=8";
    const response=await fetch(url,{headers:{
      apikey:process.env.SUPABASE_SECRET_KEY,
      Authorization:"Bearer "+process.env.SUPABASE_SECRET_KEY
    }});
    const data=await response.json();
    if(!response.ok) throw new Error(data?.message||"Database request failed.");
    return res.status(200).json({scans:data});
  }catch(error){
    console.error(error);
    return res.status(200).json({scans:[]});
  }
}
