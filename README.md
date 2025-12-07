# DealRushSite

DealRush is a group‑buying e‑commerce platform with dynamic position‑based pricing and real‑time deal countdowns.

## Quick start (local)

1. Clone:
   git clone https://github.com/ydisolution/DealRushSite.git
   cd DealRushSite

2. Install:
   npm ci

3. Development:
   - Start dev (server + frontend integrated):
     npm run dev
   - The server defaults to port 5000.

4. Build & Start:
   npm run build
   npm run start

## Environment variables (names only — DO NOT store secret values in the repo)
- DATABASE_URL
- SESSION_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- VITE_STRIPE_PUBLIC_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- GMAIL_CLIENT_ID
- GMAIL_CLIENT_SECRET
- (Optional) SENTRY_DSN, REDIS_URL, SMTP_*

> Add these values in GitHub Secrets (Settings → Secrets and variables → Actions) and in your deployment provider (Vercel / Railway).

## Recommended staging / production architecture
- Frontend: Vercel (good support for Vite + React)
- Backend: Railway or Render (easy Node/Express deployment)
- Database: Neon (Postgres serverless) — works well with Drizzle
This setup keeps costs low initially and is simple to operate.

## Rotating exposed keys (brief)
1. Google OAuth: Console → APIs & Services → Credentials → create a new OAuth client (Web application) and set Authorized redirect URIs to your backend callback (e.g. `https://<your-backend>/api/auth/google/callback`). Delete or disable old client IDs.
2. Stripe: Dashboard → Developers → API keys → rotate/create new keys; set up a new Webhook endpoint and copy the signing secret. Disable old keys.
3. Add new secrets to GitHub / Vercel / Railway, then redeploy.

## CI
A GitHub Actions workflow is added at `.github/workflows/ci.yml`. It performs:
- npm ci
- npm run check (TypeScript)
- npm run build
- npm audit (report only)

If build steps require environment variables, CI will record the failure — add the required secrets in GitHub to allow full verification.

## How I'll test locally
- Run `npm ci` then `npm run dev` and verify:
  - Frontend loads and connects to backend endpoints.
  - Basic auth and API endpoints respond.

## Next recommended steps
1. Rotate any keys already exposed and place new values in GitHub Secrets / Vercel / Railway.
2. Merge CI PR into `main`.
3. I will then proceed with staging deployment (Vercel + Railway + Neon) and deeper backend refactors.
