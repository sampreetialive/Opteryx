# 🛡️ ScamShield

A minimalist scam-awareness web app with a free backend.

Live static demo: https://sampreetialive.github.io/Opteryx/

## Stack

- Frontend: vanilla HTML/CSS/JavaScript
- Backend: Vercel serverless functions
- AI: Groq API with a multimodal vision model
- Database: Supabase free tier (optional)
- No AWS required

## AI setup

ScamShield uses Groq for both text and screenshot analysis. The default model is `qwen/qwen3.6-27b`, which supports image inputs and JSON output.

Set these as **Vercel Environment Variables**; never commit the key to GitHub:

```text
GROQ_API_KEY=your_private_groq_key
GROQ_MODEL=qwen/qwen3.6-27b
```

Optional history variables:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

After changing environment variables, redeploy the Vercel project.

## Screenshot analysis

The browser compresses screenshots before sending them to `/api/analyze`. The backend sends the image itself to Groq's multimodal model, so users do **not** need to paste OCR text.

Test the backend after deployment:

```text
https://YOUR-VERCEL-DOMAIN/api/health
```

It should return JSON containing `groq_configured: true`.

## Important

GitHub Pages can host the frontend, but it cannot execute the `/api/*.js` serverless functions. Use the Vercel deployment URL for the working AI application.

Never commit `.env.local`, API keys, or Supabase secrets to GitHub.

Groq quotas/rate limits depend on the current Groq plan; an API key should be treated as a secret even if the account has a generous or effectively unlimited allowance.
