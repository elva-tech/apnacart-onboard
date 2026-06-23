# Testing Checklist — ApnaCart Merchant Onboarding

Use this checklist to verify Phase 1 and Phase 2 functionality before go-live.

## Environment Setup

- [ ] Apps Script deployed and health check (GET) returns success with `infrastructure` status
- [ ] `VITE_APPS_SCRIPT_URL` configured in frontend `.env` or Vercel
- [ ] `setupOnboardingInfrastructure()` executed successfully (or auto-runs on first submit)
- [ ] `testInfrastructure()` returns `sheetExists: true`, `headersVerified: true`, `driveFolderExists: true`
- [ ] `Merchant_Onboarding` sheet exists with all Phase 1 + Phase 2 headers (run `setupOnboardingInfrastructure()`)
- [ ] `ApnaCart Merchant Onboarding` Drive folder exists (ID stored in Script Properties)

---

## Page 1 — Welcome

- [ ] Title displays "Welcome to ApnaCart Merchant Onboarding"
- [ ] Description text is visible
- [ ] "Start Onboarding" navigates to Business Information
- [ ] Page is mobile responsive

---

## Page 2 — Business Information

- [ ] Required fields show validation errors when empty
- [ ] Invalid email shows error message
- [ ] Invalid Indian mobile number shows error
- [ ] Invalid GST format shows error
- [ ] Valid PAN accepted; invalid PAN rejected
- [ ] Secondary phone optional but validated if provided
- [ ] "Previous" returns to Welcome
- [ ] "Next" saves data and navigates to Store Location

---

## Page 3 — Store Location

- [ ] Address, city, state, pincode validations work
- [ ] State dropdown lists Indian states
- [ ] Pincode rejects non-6-digit values
- [ ] Map loads and is interactive
- [ ] Clicking map sets marker and updates lat/lng
- [ ] Latitude and longitude fields are read-only
- [ ] Submission blocked without map selection
- [ ] Navigation works (Previous / Next)

---

## Page 4 — Delivery Configuration

- [ ] Numeric fields reject non-positive values
- [ ] Free delivery field is optional
- [ ] COD and Online Payment checkboxes work
- [ ] Error shown when both payment options disabled
- [ ] Navigation works

---

## Page 5 — Store Timings

- [ ] All 7 days display with open/close time inputs
- [ ] "Closed" checkbox hides time inputs
- [ ] Close time must be after open time
- [ ] "Copy Monday Timings To All Days" copies correctly
- [ ] Navigation works

---

## Page 6 — Branding

- [ ] Logo upload required — error if missing
- [ ] Banner upload optional
- [ ] Image preview displays after upload
- [ ] PNG, JPG, JPEG, WEBP accepted
- [ ] Files over 5 MB rejected
- [ ] Replace and Remove buttons work
- [ ] Brand color picker works
- [ ] Navigation works

---

## Page 7 — Admin Account

- [ ] Required field validation works
- [ ] Email validation works
- [ ] Indian mobile validation works
- [ ] Navigation works (Next → Merchant Operations)

---

## Page 8 — Merchant Operations *(Phase 2)*

- [ ] WhatsApp number validated as Indian mobile
- [ ] Support phone validated as Indian mobile
- [ ] Support email validated
- [ ] Delivery Model required (Store Managed / ApnaCart Managed / Hybrid)
- [ ] Estimated Delivery Time required (15–90 minutes options)
- [ ] Navigation works

---

## Page 9 — Legal Documents *(Phase 2)*

- [ ] GST Certificate required — PDF/PNG/JPG/JPEG, max 10 MB
- [ ] PAN Card required
- [ ] FSSAI optional
- [ ] Business Registration optional
- [ ] Upload preview displays
- [ ] Invalid file type or oversize file rejected
- [ ] Navigation works

---

## Page 10 — Banking Information *(Phase 2)*

- [ ] Account Holder Name, Bank Name, Account Number required
- [ ] IFSC format validated
- [ ] UPI ID format validated
- [ ] Navigation works

---

## Page 11 — Store Assets *(Phase 2)*

- [ ] Store Front Photo required with image preview
- [ ] Store Interior Photo required with image preview
- [ ] PNG/JPG/JPEG accepted, max 10 MB
- [ ] Navigation works

---

## Page 12 — Review & Submit

- [ ] All sections display collected data correctly
- [ ] "Edit" buttons navigate to correct step
- [ ] All Phase 2 sections display on review page
- [ ] Document and store asset previews visible where applicable
- [ ] Submit shows loading state
- [ ] Successful submit navigates to Success page
- [ ] API error displays user-friendly message

---

## Page 13 — Success

- [ ] Success message displayed
- [ ] Onboarding ID shown in format `APN-YYYYMMDD-XXXX`
- [ ] Merchant Code shown (`MER0001` format)
- [ ] Store Code shown (`STORE0001` format)
- [ ] Confirmation message visible
- [ ] Direct URL access without submission shows fallback message

---

## Global Features

- [ ] Progress bar updates on each step
- [ ] Step counter shows correct step during wizard
- [ ] Local storage persists data across page refresh
- [ ] Browser warns before leaving mid-onboarding
- [ ] No warning after successful submission
- [ ] Mobile layout usable on small screens (320px+)
- [ ] Loading spinner on submit button
- [ ] Professional, consistent UI across all pages

---

## Backend Integration

- [ ] Submit creates new row in `Merchant_Onboarding` sheet
- [ ] Status column = `SUBMITTED`
- [ ] Submitted At timestamp populated
- [ ] All form fields mapped to correct columns
- [ ] Onboarding ID is unique and sequential per day
- [ ] Drive folder structure: `Branding/`, `Documents/`, `StoreAssets/`
- [ ] Logo/banner uploaded to `Branding/`
- [ ] Legal documents uploaded to `Documents/`
- [ ] Store photos uploaded to `StoreAssets/`
- [ ] Merchant Code and Store Code generated and stored (unique, never change on resubmit)
- [ ] Review Status = `SUBMITTED`, Go Live Status = `PENDING`
- [ ] Completion Percentage calculated and stored

---

- [ ] Re-running `setupOnboardingInfrastructure()` appends Phase 2 columns without duplicating
- [ ] `migrateExistingMerchants()` backfills codes for Phase 1 rows only when missing

- [ ] Second submission same day gets incremented ID (e.g. 0002)
- [ ] Closed days stored as "CLOSED" in sheet
- [ ] Empty optional fields stored as blank in sheet
- [ ] Large but valid images (under 5 MB) upload successfully
- [ ] Corrupt localStorage gracefully resets to defaults

---

## Deployment Smoke Test

- [ ] Production frontend loads without console errors
- [ ] Production API URL configured (not placeholder)
- [ ] End-to-end submission works in production
- [ ] Vercel SPA routing works (direct URL to `/review` etc.)

---

## Sign-off

| Role | Name | Date | Pass/Fail |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product | | | |
