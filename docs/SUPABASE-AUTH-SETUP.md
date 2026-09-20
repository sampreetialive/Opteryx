# ScamShield authentication setup

The frontend now uses Supabase Auth for email/password sign-up and sign-in. The whole ScamShield console stays hidden until a valid user session exists.

## Supabase Dashboard

Open the ScamShield project in Supabase.

### 1. Enable email authentication

Go to **Authentication → Providers → Email** and make sure Email is enabled.

Supabase-hosted projects normally use email confirmation by default. With confirmation enabled, sign-up creates the account and sends a confirmation email; the user must confirm before the session is established. With confirmation disabled, sign-up can create the account and return a session immediately. See the Supabase Auth documentation for the exact project setting.

### 2. Add the browser-safe API key

Go to **Project Settings → API** and copy the project's **publishable key**. The older **anon** key also works.

In the repository's `config.js`, replace:

```js
supabaseAnonKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
```

with the public key.

Never place a Supabase secret/service-role key or a Groq API key in `config.js`.

### 3. Optional email confirmation redirect

For the smoothest confirmation flow, set the Supabase **Site URL** to:

```
https://sampreetialive.github.io/Opteryx/
```

and allow that URL under **Authentication → URL Configuration** if your project asks for an allowed redirect URL.

### 4. Backend protection

`supabase/config.toml` enables JWT verification for the ScamShield Edge Function. The frontend sends the signed-in user's access token with every AI analysis request.

### 5. User experience

Signed out:

```
Authentication landing page
    ↓
Sign up / Sign in
```

Signed in:

```
ScamShield console
    ↓
Message / Link / Screenshot analysis
    ↓
Supabase Edge Function → Groq
```

Signing out returns the user to the authentication landing page.
