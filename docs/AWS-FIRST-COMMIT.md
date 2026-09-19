# AWS First Commit integration

ScamShield uses the Build It path for the AWS requirement.

The official event page lists Strands Agents SDK among the AWS open-source technologies for Build It; this track is designed to run locally without an AWS cloud deployment.

Existing production path:
GitHub Pages -> Supabase Edge Function -> Groq

Added AWS path:
ScamShield report -> Strands Agent -> validation tool -> safety checklist tool -> investigation brief

The Strands TypeScript SDK is model-agnostic and its OpenAI provider can connect to OpenAI-compatible endpoints, which lets the agent use the same Groq account without changing the working production backend.

For the demo, show the live scam scan first, then run the Strands agent in aws/strands-agent. This demonstrates that AWS tooling is actually used by the project without rehosting the app.

Important: do not claim the live site is AWS-hosted. The AWS component is the Strands Build It agent.