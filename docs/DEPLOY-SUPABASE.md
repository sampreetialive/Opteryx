# ScamShield — Supabase backend setup

The app no longer uses Vercel or Better Auth.

Architecture:

GitHub Pages → Supabase Edge Function → Groq

## One-time setup

### 1. Create/open a Supabase project

Open your Supabase dashboard and create a project if you do not already have one.

### 2. Create the Edge Function

In the Supabase dashboard:

**Edge Functions → Deploy a new function → Via Editor**

Name the function:

`scamshield`

Replace the editor code with the contents of:

`supabase/functions/scamshield/index.ts`

Then choose **Deploy function**.

Supabase documents dashboard-based Edge Function creation and deployment, including built-in Deno type-checking, so you do not need the Supabase CLI for this setup.

### 3. Add the only required secret

Open the function's **Secrets Management** and add:

`GROQ_API_KEY`

Value:

your real Groq API key.

Optional:

`GROQ_MODEL` = `qwen/qwen3.6-27b`

Optional:

`SCAMSHIELD_ALLOWED_ORIGINS` = `https://sampreetialive.github.io`

Do not put the Groq key into GitHub or `config.js`.

### 4. Copy the function URL

Supabase will show the function URL in this form:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/scamshield`

Put that exact URL into `config.js`:

```js
window.SCAMSHIELD_CONFIG = {
  supabaseFunctionUrl: "https://YOUR_PROJECT_REF.supabase.co/functions/v1/scamshield"
};
```

Commit this one-line configuration change to GitHub.

### 5. Test

Open:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/scamshield?action=health`

Expected response:

```json
{
  "ok": true,
  "service": "ScamShield Supabase Edge Function",
  "groq_configured": true
}
```

Then open the GitHub Pages site and run a message scan.

### 6. Optional history

The SQL schema is in `supabase/schema.sql`. Run it in Supabase SQL Editor only when you want persistent scan history.

Supabase's hosted Edge Functions receive Supabase's own project environment variables automatically. The ScamShield function currently uses only the Groq secret; database persistence is optional.

## No Vercel step exists

You can delete or ignore any old Vercel project. It is no longer part of the app architecture.

## Troubleshooting

If the health endpoint says `groq_configured: false`, add `GROQ_API_KEY` to Edge Function Secrets.

If the GitHub Pages app says the backend URL is missing, set `supabaseFunctionUrl` in `config.js`.

If the function returns a Groq model error, set `GROQ_MODEL` to a model available to the Groq account.
