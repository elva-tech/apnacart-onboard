# ApnaCart Merchant Onboarding Portal

A production-ready merchant onboarding portal for ApnaCart. This application collects all information required to configure a merchant store before going live and prepares launch-ready merchant records.

**This is not** an e-commerce app, merchant dashboard, or admin panel. It is a customer-facing onboarding wizard used before store activation.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Hook Form, Zod, React Router |
| Backend | Google Apps Script Web App |
| Data Store | Google Sheets (`Merchant_Onboarding`) |
| File Storage | Google Drive (`ApnaCart Merchant Onboarding/`) |
| Deployment | Vercel (frontend), Google Web App (backend) |

## Workflow System *(Phase 4)*

- **Customer auth** — Phone + password login (`Merchant_Credentials` sheet)
- **Session management** — Token-based sessions (`Merchant_Sessions` sheet)
- **Customer dashboard** — 5-step progress tracking, resume onboarding
- **Auto-save** — Each form step saves independently to Google Sheets
- **Submission locking** — Read-only when SUBMITTED / UNDER_REVIEW / APPROVED / GO_LIVE
- **Reject workflow** — Admin comments; merchant can edit when REJECTED
- **Approval workflow** — APPROVED permanently locks; ready for tenant provisioning
- **Admin portal** — `/admin` merchant list, review, approve/reject

### Workflow Steps

1. Store Information — location, delivery, timings, branding, assets
2. Business & Compliance — admin, operations, documents, banking
3. Product Catalog — existing catalog module
4. Agreements — terms, merchant agreement, privacy
5. Review & Submit

### Workflow Statuses

`DRAFT` → `IN_PROGRESS` → `SUBMITTED` → `UNDER_REVIEW` → `REJECTED` / `APPROVED` → `GO_LIVE`

## Phase 3 Features

- **Product Catalog Setup** — post-onboarding module at `/catalog`
- **Excel/CSV import** — Products.xlsx with template download and validation
- **Image ZIP upload** — auto-matching engine (e.g. `milk_500ml.jpg` ↔ `Milk 500ML`)
- **Product review** — inline editing, bulk category/price/stock updates
- **Category management** — hierarchical categories (Dairy → Milk → …)
- **Catalog dashboard** — completion %, missing images, duplicates, errors
- **Reports** — export missing images, duplicates, price validation as Excel
- **Approval workflow** — DRAFT → SUBMITTED → APPROVED → LIVE
- **Sheets**: `Merchant_Products`, `Merchant_Categories`
- **Drive**: `ApnaCart Product Catalog/MER0001/Products/`

## Phase 2 Features

- **Merchant Operations** — WhatsApp, support contacts, delivery model, estimated delivery time
- **Legal Documents** — GST certificate, PAN, FSSAI, business registration (PDF/images, 10 MB)
- **Banking Information** — Account details, IFSC, UPI (collection only, no payment integration)
- **Store Assets** — Store front and interior photos
- **Auto-generated codes** — `MER0001` merchant code, `STORE0001` store code
- **Go-live tracking** — Review status, go-live status, completion percentage
- **Enhanced Drive structure** — `Branding/`, `Documents/`, `StoreAssets/` subfolders
- **Idempotent migration** — `migrateExistingMerchants()` for Phase 1 rows

## Phase 1 Features (preserved)

- 11-step onboarding wizard with progress bar
- Local progress persistence and leave-page warning
- Google Sheets + Drive integration
- Onboarding ID generation (`APN-YYYYMMDD-XXXX`)
- Interactive map picker, branding uploads, store timings, delivery settings

## Onboarding Flow

1. Welcome
2. Business Information
3. Store Location
4. Delivery Configuration
5. Store Timings
6. Branding
7. Admin Account
8. **Merchant Operations** *(Phase 2)*
9. **Legal Documents** *(Phase 2)*
10. **Banking Information** *(Phase 2)*
11. **Store Assets** *(Phase 2)*
12. Review & Submit
13. Success → **Product Catalog Setup** *(Phase 3)*

## Product Catalog Flow *(Phase 3)*

1. Dashboard — stats and completion %
2. Upload Products — Excel/CSV with validation
3. Upload Images — ZIP with auto-matching
4. Review Products — inline fixes and bulk actions
5. Categories — hierarchical category tree
6. Reports — export validation reports
7. Submit Catalog — ELVA review (SUBMITTED → APPROVED)

## Environment Variables

```env
VITE_APPS_SCRIPT_URL=/api/onboarding
VITE_APPS_SCRIPT_TARGET=https://script.google.com/macros/s/YOUR_ID/exec
```

## API Response

```json
{
  "success": true,
  "onboardingId": "APN-20260623-0001",
  "merchantCode": "MER0001",
  "storeCode": "STORE0001",
  "completionPercentage": 100
}
```

## Migration

Run in Apps Script editor after deploying updates:

1. `setupOnboardingInfrastructure()` — onboarding columns
2. `setupCatalogInfrastructure()` — product catalog sheets *(Phase 3)*
3. `migrateExistingMerchants()` — backfill codes for Phase 1 rows

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Testing Checklist](docs/TESTING_CHECKLIST.md)

## License

Proprietary — ApnaCart
