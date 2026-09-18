import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { corsHeaders, json } from "../shared/response.mjs";
const region = process.env.AWS_REGION || "ap-south-1";
const tableName = process.env.SCAN_TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
  try {
    if (!tableName) return json(500, { error: "Scan history is not configured." });
    const result = await ddb.send(new ScanCommand({ TableName: tableName, Limit: 20 }));
    const scans = (result.Items || []).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(x => ({
      id:x.id, input_type:x.inputType, content_preview:x.contentPreview, risk_score:x.riskScore, risk_level:x.riskLevel, category:x.category, created_at:x.createdAt
    }));
    return json(200, { scans });
  } catch (error) { console.error("History error", error); return json(500, { error: "Could not load scan history." }); }
};