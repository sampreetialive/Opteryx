export default function handler(req,res) {
  res.status(200).json({
    ok:true,
    service:"ScamShield API",
    groq_configured:Boolean(process.env.GROQ_API_KEY),
    groq_model:process.env.GROQ_MODEL || "qwen/qwen3.6-27b",
    supabase_configured:Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)
  });
}
