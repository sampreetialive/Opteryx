export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json", ...corsHeaders },
    body: JSON.stringify(body)
  };
}
