# ScamShield AWS Build It layer

This folder contains the project's real AWS open-source integration: Strands Agents SDK.

The live product remains GitHub Pages -> Supabase Edge Function -> Groq. This AWS layer is additive; it does not require a frontend rewrite or a new cloud deployment.

Strands is used as an actual agent with custom tools. The agent validates the existing ScamShield report, generates a safety checklist, and produces a second-pass investigation brief.

Requirements: Node.js 22+, npm, and a Groq API key for the local agent. The First Commit Build It track explicitly lists Strands Agents SDK among the AWS open-source stack and is designed to run locally.

Install:
npm install

Run the self-contained example:
npm run demo

Run against the live ScamShield backend:
PowerShell:
$env:GROQ_API_KEY="your_key"
$env:SUPABASE_FUNCTION_URL="https://YOUR_PROJECT_REF.supabase.co/functions/v1/scamshield"
npm run demo -- "URGENT: your bank account will be blocked today. Verify immediately."

Run the syntax check:
npm run check

Do not commit API keys.