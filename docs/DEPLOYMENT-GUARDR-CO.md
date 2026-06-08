# Deploy Guardr to guardr.co (Vercel + GoDaddy + Supabase)

Step-by-step for connecting **GoDaddy domain** → **Vercel** → **Supabase** + **Stripe**.

---

## Part 1 — Supabase

### 1. Create / open your project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a project (or open your existing one)
3. Wait until the database is ready

### 2. Run database migrations
1. In Supabase: **SQL Editor** → **New query**
2. Open each file in `supabase/migrations/` **in filename order** (oldest first)
3. Paste and **Run** each file one at a time

Minimum order:
- `20260606000000_initial_schema.sql`
- `20260606000001_add_staff_role.sql`
- … through latest migration

### 3. Get your API keys
**Project Settings → API**

| Key | Where it goes |
|-----|----------------|
| **Project URL** | `VITE_SUPABASE_URL` and `SUPABASE_URL` |
| **anon public** | `VITE_SUPABASE_ANON_KEY` |
| **service_role** (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

Never put `service_role` in frontend code or `VITE_*` variables.

### 4. Allow guardr.co in Supabase Auth URLs
**Authentication → URL configuration**

| Field | Value |
|-------|--------|
| **Site URL** | `https://www.guardr.co` |
| **Redirect URLs** | `https://www.guardr.co/**` |
| | `https://guardr.co/**` |

**Important:** Use `www.guardr.co` as your primary URL until both domains show valid SSL in Vercel. If `guardr.co` (without www) shows `ERR_FAILED` in the browser, the apex domain SSL is not set up yet — use www or fix DNS below.

Click **Save**.

---

## Part 2 — Vercel environment variables

1. Open [vercel.com](https://vercel.com) → your Guardr project
2. **Settings → Environment Variables**
3. Add these for **Production** (and Preview if you want):

```
APP_URL=https://www.guardr.co
VITE_APP_URL=https://www.guardr.co

VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. **Redeploy** after saving (Deployments → ⋮ → Redeploy)

### Verify API works
After deploy, open:
```
https://www.guardr.co/api/health
```
You should see JSON with `"status":"ok"`.

If `https://guardr.co` (without www) shows `ERR_FAILED`, use `www` until apex SSL is valid in Vercel → Domains.

---

## Part 3 — Connect GoDaddy domain to Vercel

### 1. Add domain in Vercel
1. Vercel project → **Settings → Domains**
2. Add `guardr.co`
3. Add `www.guardr.co` (recommended — redirect www → root or vice versa)

Vercel shows DNS records you need. Usually one of:

**Option A — Use Vercel nameservers (easiest)**
- In GoDaddy: **Domain → DNS → Nameservers → Change**
- Switch to **Custom** and use Vercel’s nameservers (e.g. `ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
- Vercel manages all DNS after that

**Option B — Keep GoDaddy DNS (A/CNAME records)**

For **guardr.co** (root/apex):
| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `76.76.21.21` |

For **www.guardr.co**:
| Type | Name | Value |
|------|------|--------|
| **CNAME** | `www` | `cname.vercel-dns.com` |

(GoDaddy sometimes labels “Name” as `@` for root and `www` for subdomain.)

### 2. Wait for DNS
- Propagation: 5 minutes to 48 hours (often under 1 hour)
- Vercel **Domains** page shows ✓ when valid

### 3. HTTPS
Vercel issues SSL automatically once DNS is correct.

---

## Part 4 — Stripe (you already started)

Confirm in Stripe Dashboard:

| Setting | Value |
|---------|--------|
| Webhook endpoint | `https://guardr.co/api/stripe/webhook` |
| Checkout success URL | Uses `APP_URL` → `https://guardr.co/?payment=success&...` |
| Connect return URL | `https://guardr.co/?stripe_connect=success` |

---

## Quick checklist

- [ ] Supabase migrations applied
- [ ] Supabase Site URL = `https://guardr.co`
- [ ] All env vars in Vercel (especially `VITE_*` for frontend)
- [ ] Redeployed on Vercel
- [ ] `https://guardr.co/api/health` works
- [ ] GoDaddy DNS points to Vercel
- [ ] Domain shows valid in Vercel
- [ ] Stripe webhook URL = `https://guardr.co/api/stripe/webhook`

---

## Troubleshooting

**Site loads but data doesn’t save**  
→ Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel, then redeploy.

**Stripe webhooks fail**  
→ Check `STRIPE_WEBHOOK_SECRET` and that webhook URL is exactly `/api/stripe/webhook`.

**Domain not connecting**  
→ In GoDaddy, remove old A/CNAME records that conflict. Use only Vercel’s records.

**www vs non-www**  
→ In Vercel Domains, set one as primary and redirect the other.
