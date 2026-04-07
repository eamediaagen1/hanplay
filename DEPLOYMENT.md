# Deployment Guide

## Frontend → Vercel

**Directory:** `artifacts/hsk-trainer`

### Steps

1. Push to GitHub (or connect Vercel to your repo)
2. In Vercel, set the **Root Directory** to `artifacts/hsk-trainer`
3. Vercel will auto-detect Vite. Confirm these settings:
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`

### Environment Variables (set in Vercel dashboard)

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon key |
| `VITE_GUMROAD_URL` | `https://gumroad.com/l/your-product` |

### API Proxy

Update `vercel.json` — replace the API rewrite destination with your real backend URL:

```json
{ "source": "/api/(.*)", "destination": "https://YOUR-BACKEND.up.railway.app/api/$1" }
```

---

## Backend → Railway (or Render)

**Directory:** `artifacts/api-server`

### Railway Steps

1. Create a new Railway project
2. Connect your GitHub repo
3. Set **Root Directory** to `artifacts/api-server`
4. Railway will auto-detect Node.js
5. Set Build Command: `pnpm install && pnpm run build`
6. Set Start Command: `pnpm run start:prod`

### Render Steps

1. Create a new **Web Service**
2. Set **Root Directory** to `artifacts/api-server`
3. Build Command: `pnpm install && pnpm run build`
4. Start Command: `node --enable-source-maps ./dist/index.mjs`

### Environment Variables (set in Railway/Render dashboard)

| Variable | Value |
|---|---|
| `PORT` | `8080` (or leave for platform default) |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `SUPABASE_ANON_KEY` | your anon key |
| `GUMROAD_WEBHOOK_SECRET` | your Gumroad webhook secret |
| `GUMROAD_PRODUCT_PERMALINK` | your Gumroad product permalink |
| `APP_URL` | `https://your-app.vercel.app` |

---

## Local Development (Replit / local machine)

Both servers continue to work unchanged for local dev:

```bash
# Backend
pnpm --filter @workspace/api-server run dev

# Frontend
pnpm --filter @workspace/hsk-trainer run dev
```

---

## Notes

- The frontend uses relative `/api/...` paths. In production these are proxied via `vercel.json` to the backend.
- The backend reads `PORT` from the environment — no hardcoded ports.
- `.env` files are git-ignored. Use `.env.example` as the template.
