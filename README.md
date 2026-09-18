# 🛡️ ScamShield

A minimalist scam-awareness web app with a free backend.
Link to the webpage: https://sampreetialive.github.io/Opteryx/

## Stack

- Frontend: vanilla HTML/CSS/JavaScript
- Backend: Vercel serverless functions
- AI: Gemini API free tier (optional; local rule engine fallback)
- Database: Supabase free tier (optional)
- No AWS required

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add a Gemini API key. The app still works without it using the local safety-rule engine.
3. Optional: create a Supabase Free project and run `supabase/schema.sql`.
4. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for persistent history.
5. Deploy the repo to Vercel or run it with the Vercel CLI.

## Backend features

- Gemini analysis for text and screenshots.
- Public URL inspection without following redirects.
- Local rule-based fallback when Gemini is unavailable.
- Supabase-backed recent scan history when configured.
- No passwords, OTPs, PINs, or card details requested.

Never commit `.env.local` or API secrets to GitHub. Use Vercel environment variables for secrets.

Current free-tier limits can change; check provider documentation before a demo.
