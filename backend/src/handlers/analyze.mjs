import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SYSTEM_PROMPT, cleanJson, inspectPublicUrl, normalizeAnalysis } from "../shared/scam.mjs";
import { json, corsHeaders } from "../shared/response.mjs";
const region = process.env.AWS_REGION || "ap-south-1";
const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
const tableName = process.env.SCAN_TABLE_NAME;
const bucketName = process.env.UPLOAD_BUCKET;
const bedrock = new BedrockRuntimeClient({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const s3 = new S3Client({ region });
async function readImage(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
  const bytes = await out.Body.transformToByteArray();
  if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Image is larger than 5 MB.");
  const type = out.ContentType || "image/png"; const format = type.split("/")[1];
  if (!["png","jpeg","webp"].includes(format)) throw new Error("Unsupported image format.");
  return { bytes, format };
}
export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const imageKey = typeof body.imageKey === "string" ? body.imageKey.trim() : "";
    if (!message && !url && !imageKey) return json(400, { error: "Provide a message, URL, or screenshot." });
    if (message.length > 12000) return json(400, { error: "Message must be under 12,000 characters." });
    const inspected = url ? await inspectPublicUrl(url) : null;
    const evidence = [
      message ? "MESSAGE:\\n" + message : "",
      url ? "USER-SUPPLIED URL:\\n" + url : "",
      inspected?.text ? "PUBLIC PAGE SAMPLE:\\n" + inspected.text : "",
      inspected ? "PAGE METADATA: HTTP " + inspected.status + "; final URL " + inspected.final_url : ""
    ].filter(Boolean).join("\\n\\n");
    const content = [{ text: evidence + "\\n\\nReturn the requested JSON only." }];
    if (imageKey) { const image = await readImage(imageKey); content.push({ image: { format: image.format, source: { bytes: image.bytes } } }); }
    const response = await bedrock.send(new ConverseCommand({
      modelId, system: [{ text: SYSTEM_PROMPT }], messages: [{ role: "user", content }],
      inferenceConfig: { maxTokens: 1200, temperature: 0.1, topP: 0.9 }
    }));
    const text = response.output?.message?.content?.map(x => x.text || "").join("") || "";
    let analysis;
    try { analysis = normalizeAnalysis(JSON.parse(cleanJson(text))); }
    catch { return json(502, { error: "The AI returned an unreadable analysis. Please try again." }); }
    if (tableName) await ddb.send(new PutCommand({ TableName: tableName, Item: {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), inputType: imageKey ? "screenshot" : url ? "link" : "message",
      contentPreview: (message || url || imageKey).slice(0, 500), riskScore: analysis.risk_score, riskLevel: analysis.risk_level,
      category: analysis.category, result: analysis
    }}));
    return json(200, { analysis, agentUsedTools: Boolean(inspected), inspectedUrl: inspected ? { status: inspected.status, finalUrl: inspected.final_url, contentType: inspected.content_type } : null });
  } catch (error) { console.error("ScamShield analysis error", error); return json(500, { error: "ScamShield could not complete the analysis." }); }
};