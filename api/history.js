export default async function handler(req,res) {
  if (req.method !== "GET") return res.status(405).json({error:"Method not allowed."});
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(200).json({scans:[]});
  try {
    const base = process.env.SUPABASE_URL.replace(/\/$/,"");
    const url = base + "/rest/v1/scan_history?select=id,input_type,content_preview,risk_score,risk_level,category,created_at&order=created_at.desc&limit=8";
    const r = await fetch(url, {
      headers:{
        "apikey":process.env.SUPABASE_SECRET_KEY,
        "Authorization":"Bearer " + process.env.SUPABASE_SECRET_KEY
      }
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || "Database request failed.");
    return res.status(200).json({scans:data});
  } catch (e) {
    console.error(e);
    return res.status(200).json({scans:[]});
  }
}