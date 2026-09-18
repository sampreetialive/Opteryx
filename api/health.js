export default function handler(req,res) {
  res.status(200).json({
    ok: true,
    service: "ScamShield API",
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
    supabase_configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)
  });
}
