# Setup Guide — ApnaCart Merchant Onboarding

This guide walks through setting up Google Sheets, Google Drive, and Google Apps Script for the onboarding backend.

## Prerequisites

- Google account with access to Google Drive and Google Sheets
- Google Apps Script enabled

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it **ApnaCart Merchant Onboarding**.
3. Note the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

The Apps Script will automatically create a sheet tab named `Merchant_Onboarding` with all required column headers when you run the setup function.

## Step 2: Create the Apps Script Project

1. In your spreadsheet, go to **Extensions → Apps Script**.
2. Delete any default code in `Code.gs`.
3. Copy the contents of `apps-script/Code.gs` from this repository into `Code.gs`.
4. Add **Workflow.gs** and paste `apps-script/Workflow.gs`.
5. Open **Project Settings** (gear icon) and enable **Show "appsscript.json" manifest file in editor**.
6. Replace the contents of `appsscript.json` with the file from `apps-script/appsscript.json` in this repository.

Also add **Catalog.gs** (Phase 3) from `apps-script/Catalog.gs`.

## Step 3: Run Initial Setup

1. In the Apps Script editor, select `setupOnboardingInfrastructure` from the function dropdown.
2. Click **Run**.
3. Grant permissions when prompted (Google Sheets + Google Drive).
4. Open **Executions** or **View → Logs** and confirm:
   - `Infrastructure setup completed.`
   - `Sheet found.` or `Sheet created: Merchant_Onboarding`
   - `Headers verified.`
   - `Drive folder found.` or `Drive folder created: ApnaCart Merchant Onboarding`

This single function automatically:
- Creates the `Merchant_Onboarding` sheet tab (if missing)
- Writes all 47 column headers with formatting (freeze, bold, filter, auto-resize)
- Creates or reuses the Drive folder `ApnaCart Merchant Onboarding`
- Stores the Drive folder ID in Script Properties

**Optional:** Run `testInfrastructure()` to verify everything before deploying.

## Step 4: Verify Sheet Columns

The `Merchant_Onboarding` sheet is created automatically with these headers (row 1):

| Columns | Headers |
|---------|---------|
| A–E | Onboarding ID, Status, Review Status, Internal Notes, Submitted At |
| F–J | Store Name, Business Name, Owner Name, GST Number, PAN Number |
| K–M | Primary Phone, Secondary Phone, Email Address |
| N–R | Store Address, Landmark, City, State, Pincode |
| S–T | Latitude, Longitude |
| U–X | Delivery Radius, Minimum Order Amount, Delivery Charge, Free Delivery Above |
| Y–Z | COD Enabled, Online Payment Enabled |
| AA–AN | Monday–Sunday Open/Close (14 columns) |
| AO–AP | Store Description, Brand Color |
| AQ–AR | Logo URL, Banner URL |
| AS–AU | Admin Name, Admin Email, Admin Phone |
| AV–AW | Merchant Code, Store Code *(Phase 2)* |
| AX–AZ | WhatsApp Number, Support Phone, Support Email *(Phase 2)* |
| BA–BD | GST/PAN/FSSAI/Registration document URLs *(Phase 2)* |
| BE–BI | Banking fields *(Phase 2)* |
| BJ–BK | Delivery Model, Estimated Delivery Time *(Phase 2)* |
| BL–BM | Store Front/Interior photo URLs *(Phase 2)* |
| BN–BP | Go Live Status, Go Live Date, Completion % *(Phase 2)* |

> Setup is **idempotent** — safe to run multiple times. Existing submission rows are never deleted. Phase 2 columns are **appended** automatically.

### Phase 2 migration for existing merchants

After deploying updated `Code.gs`:

1. Run `setupOnboardingInfrastructure()` to append Phase 2 columns.
2. Run `migrateExistingMerchants()` to backfill `MER####` / `STORE####` codes for Phase 1 rows missing them.
3. Redeploy the Web App (new version).

### Phase 3 catalog setup

After deploying Phase 3 code (`Code.gs` + `Catalog.gs`):

1. Run `setupCatalogInfrastructure()` to create:
   - `Merchant_Products` sheet (19 columns)
   - `Merchant_Categories` sheet (8 columns)
   - `ApnaCart Product Catalog` Drive folder
2. Redeploy the Web App (new version).
3. Verify health check returns `"apiVersion": 3` and `catalog.productsSheetExists: true`.

#### Merchant_Products columns

Merchant Code, Store Code, Product ID (`PRD-000001`), Product Name, Category, Description, SKU, Brand, Unit, Weight, MRP, Selling Price, Stock Quantity, HSN Code, Tax Percentage, Image URL, Product Status, Created At, Updated At

#### Merchant_Categories columns

Merchant Code, Category ID, Name, Parent Category ID, Parent Path, Level, Created At, Updated At

#### Product catalog Drive structure

```
ApnaCart Product Catalog/
└── MER0001/
    └── Products/
        ├── milk500ml.jpg
        ├── curd1kg.jpg
        └── paneer200gm.jpg
```

### Phase 4 workflow setup

After deploying Phase 4 code (`Workflow.gs`):

1. Run `setupWorkflowInfrastructure()` — creates credentials, sessions, admin sheets, workflow columns.
2. Default admin: phone `9999999999`, password `admin123` (stored as plain text in sheet — change after first login).
3. Run **`fixCredentialsSheetLayout()`** to remove duplicate Password Hash columns and keep one plain **Password** column.
4. Redeploy Web App (new version).
4. Verify health check returns `"apiVersion": 4`.

#### New sheets

| Sheet | Purpose |
|-------|---------|
| `Merchant_Credentials` | Phone, password (plain text), merchant code |
| `Admin_Credentials` | Phone, password (plain text), admin name |
| `Merchant_Sessions` | Session tokens |
| `Admin_Credentials` | ELVA admin login |

#### New workflow columns on `Merchant_Onboarding`

Workflow Status, Current Workflow Step, Step 1–5 Progress, Admin Comments, Agreements Accepted, Agreement Version, Agreement Accepted At

## Step 5: Deploy as Web App

1. In Apps Script, click **Deploy → New deployment**.
2. Select type: **Web app**.
3. Configure:
   - **Description:** ApnaCart Onboarding API v1
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** and authorize if prompted.
5. Copy the **Web app URL** — this is your API endpoint.

> **Critical:** "Who has access" must be **Anyone** (anonymous). If set to "Anyone with Google account", submissions return **401 Unauthorized**.

> **Important:** Every time you change `Code.gs`, create a **New deployment** (or manage deployments → edit → New version) for changes to take effect.

### Verify public access

Open the Web App URL in an **incognito/private** browser window. You must see JSON (not a Google Sign-In page):

```json
{ "success": true, "message": "ApnaCart Merchant Onboarding API is running", ... }
```

If you see a login page, edit the deployment and change access to **Anyone**, then redeploy.

## Step 6: Configure the Frontend

1. In `frontend/`, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set both variables:
   ```
   VITE_APPS_SCRIPT_URL=/api/onboarding
   VITE_APPS_SCRIPT_TARGET=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
3. Update the same target URL in `frontend/vercel.json` under the `/api/onboarding` rewrite.

## Step 7: Test the API

Open the Web App URL in a browser. You should see:

```json
{
  "success": true,
  "message": "ApnaCart Merchant Onboarding API is running",
  "endpoints": ["POST submitOnboarding"],
  "infrastructure": {
    "sheetExists": true,
    "headersVerified": true,
    "driveFolderExists": true,
    "driveFolderId": "...",
    "totalHeaders": 47
  }
}
```

Or run `testInfrastructure()` in the Apps Script editor for the same checks.

## Google Drive Structure

After submissions, files are organized as:

```
ApnaCart Merchant Onboarding/
└── APN-20260623-0001/
    ├── Branding/
    │   ├── logo.png
    │   └── banner.jpg
    ├── Documents/
    │   ├── gst.pdf
    │   ├── pan.pdf
    │   ├── fssai.pdf
    │   └── registration.pdf
    └── StoreAssets/
        ├── storefront.jpg
        └── interior.jpg
```

Uploaded files are shared as "Anyone with the link can view" so URLs stored in the sheet are accessible to your team.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** on submit | Redeploy Web App with **Who has access: Anyone** (not "Anyone with Google account"). Test URL in incognito — must return JSON. |
| CORS errors on submit | Frontend uses `/api/onboarding` proxy (already configured). Restart `npm run dev` after `.env` changes. |
| Permission denied | Re-run setup and re-authorize the script |
| Sheet not updating | Verify the script is bound to the correct spreadsheet |
| Old code running | Create a new deployment version |
| Logo upload fails | Check Drive storage quota and script permissions |

## Security Notes (Phase 1)

- No authentication is implemented in Phase 1 by design.
- The Web App is publicly accessible — do not expose sensitive admin credentials beyond what merchants provide.
- Consider restricting the onboarding URL distribution and monitoring sheet access in production.
