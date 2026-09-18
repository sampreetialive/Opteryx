import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  const result = await db.query(
    "SELECT id, input_type, content_preview, risk_score, risk_level, category, created_at FROM scan_history ORDER BY created_at DESC LIMIT 8"
  );
  res.json({ scans: result.rows });
}