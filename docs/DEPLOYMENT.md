# Deployment Guide — ApnaCart Merchant Onboarding

## Overview

| Component | Platform | URL Pattern |
|-----------|----------|-------------|
| Frontend | Vercel | `https://your-project.vercel.app` |
| Backend | Google Apps Script | `https://script.google.com/macros/s/.../exec` |

---

## Backend Deployment (Google Apps Script)

### Initial Deployment

Follow [SETUP.md](SETUP.md) Steps 1–5 to deploy the Apps Script Web App.

### Updating the Backend (Phase 2+)

1. Paste updated `Code.gs` into the Apps Script editor.
2. Run `setupOnboardingInfrastructure()` once to append new columns.
3. Run `migrateExistingMerchants()` if you have existing Phase 1 submissions.
4. Deploy → Manage deployments → New version → Deploy.

The Web App URL remains the same — no frontend changes needed unless you create an entirely new deployment.

### Production Checklist

- [ ] `setupOnboardingInfrastructure()` has been run successfully
- [ ] Phase 2 columns present in `Merchant_Onboarding` (if upgrading from Phase 1)
- [ ] `migrateExistingMerchants()` run for existing rows (if applicable)
- [ ] Web App deployed with "Execute as: Me" and "Anyone" access
- [ ] GET health check returns success JSON
- [ ] Test submission creates a row in `Merchant_Onboarding`
- [ ] Test submission creates a folder in Google Drive

---

## Frontend Deployment (Vercel)

### Option A: Vercel CLI

```bash
cd frontend
npm install
npm run build

# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel
```

### Option B: GitHub Integration

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Set **Root Directory** to `frontend`.
4. Configure environment variables (see below).
5. Deploy.

### Environment Variables

| Name | Value | Notes |
|------|-------|-------|
| `VITE_APPS_SCRIPT_URL` | `/api/onboarding` | Same-origin proxy path (do not use the raw GAS URL here) |
| `VITE_APPS_SCRIPT_TARGET` | `https://script.google.com/macros/s/.../exec` | Used by Vite dev proxy locally |

**Critical:** `frontend/vercel.json` rewrite for `/api/onboarding` must point to the **same** Apps Script deployment URL as `VITE_APPS_SCRIPT_TARGET`. If these differ, production will hit an old backend and Phase 2 columns will stay empty.

After updating Apps Script code, always **Deploy → Manage deployments → New version → Deploy**. Editing `Code.gs` alone does not update the live Web App.

### Build Settings

Vercel auto-detects Vite. Default settings work:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

The included `vercel.json` configures SPA routing so all paths serve `index.html`.

### Custom Domain (Optional)

1. In Vercel → **Settings → Domains**, add your domain (e.g. `onboard.apnacart.com`).
2. Configure DNS as instructed by Vercel.
3. SSL is provisioned automatically.

---

## Post-Deployment Verification

1. Open the deployed frontend URL.
2. Complete the full onboarding flow with test data.
3. Verify:
   - Row appears in Google Sheet with status `SUBMITTED`
   - Onboarding ID format is `APN-YYYYMMDD-XXXX`
   - **Merchant Code** (`MER0001`) and **Store Code** (`STORE0001`) populated
   - Phase 2 columns (WhatsApp, banking, document URLs, etc.) populated
   - GET `/api/onboarding` health check returns `"apiVersion": 2`
   - Logo and banner appear in `Branding/` subfolder
   - Success page displays onboarding ID and merchant/store codes
4. Test on mobile (responsive layout, map picker, file upload).

---

## Rollback

### Frontend
- In Vercel → **Deployments**, promote a previous successful deployment.

### Backend
- In Apps Script → **Manage deployments**, switch to a previous version.

---

## Monitoring

- **Google Sheet:** Primary data audit trail for all submissions.
- **Google Drive:** Verify file uploads per onboarding ID.
- **Apps Script:** Check **Executions** for errors and execution time.
- **Vercel:** Monitor build logs and analytics for frontend issues.
