# 🛡️ ScamShield

ScamShield is a scam-awareness web app for suspicious messages, links and screenshots.

## Simple architecture

**GitHub Pages → Supabase Edge Function → Groq**

Vercel is not required. Better Auth is not required. No API key is stored in the browser.

### Frontend

GitHub Pages serves the root:

- `index.html`
- `app.js`
- `styles.css`
- `config.js`

### Backend

The backend lives in:

`supabase/functions/scamshield/index.ts`

Deploy it from the Supabase Dashboard as an Edge Function named `scamshield`.

### Supabase secrets

In **Supabase → Edge Functions → Secrets Management**, add:

`GROQ_API_KEY` = your real Groq key

Optional:

`GROQ_MODEL` = `qwen/qwen3.6-27b`

Optional:

`SCAMSHIELD_ALLOWED_ORIGINS` = `https://sampreetialive.github.io`

Never put the Groq key in `config.js` or GitHub.

### Connect the frontend

After deploying the Edge Function, its URL is:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/scamshield`

Put that URL in `config.js`:

```js
window.SCAMSHIELD_CONFIG = {
  supabaseFunctionUrl: "https://YOUR_PROJECT_REF.supabase.co/functions/v1/scamshield"
};
```

Then commit the change.

### Test the backend

Open:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/scamshield?action=health`

It should return JSON and show `groq_configured: true` after the Groq secret is configured.

### Database

Persistent scan history is optional. The canonical schema is in `supabase/schema.sql`.

### Validation

```bash
npm run check
```

The GitHub Pages workflow runs the same syntax check before deploying.

## What is implemented

- Message scanning
- URL scanning with public-page inspection
- Screenshot upload and multimodal AI analysis
- Explainable risk scores
- Safe action plans
- GitHub Pages deployment
- Supabase Edge Function backend
- Groq AI
- Optional Supabase scan history
- Local message/link fallback when the backend URL is not configured

## Prototype-only areas

- Community report moderation
- Paid subscriptions
- User accounts
- Advanced persistent abuse/rate limiting
- External URL reputation feeds
