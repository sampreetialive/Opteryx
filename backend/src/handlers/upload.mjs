import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { corsHeaders, json } from "../shared/response.mjs";
const region = process.env.AWS_REGION || "ap-south-1";
const bucketName = process.env.UPLOAD_BUCKET;
const s3 = new S3Client({ region });
const allowedTypes = new Set(["image/png","image/jpeg","image/webp"]);
const maxBytes = 5 * 1024 * 1024;
export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
    const contentType = String(body.contentType || ""); const size = Number(body.size || 0);
    if (!allowedTypes.has(contentType)) return json(400, { error: "Only PNG, JPEG, and WebP are supported." });
    if (!Number.isFinite(size) || size <= 0 || size > maxBytes) return json(400, { error: "Screenshot must be between 1 byte and 5 MB." });
    if (!bucketName) return json(500, { error: "Upload bucket is not configured." });
    const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
    const key = "uploads/" + crypto.randomUUID() + "." + extension;
    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucketName, Key:key, ContentType:contentType }), { expiresIn:300 });
    return json(200, { uploadUrl, key, expiresIn:300 });
  } catch (error) { console.error("Upload error", error); return json(500, { error: "Could not create an upload URL." }); }
};