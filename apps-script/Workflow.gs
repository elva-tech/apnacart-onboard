/**
 * ApnaCart Workflow System — Auth, Sessions, Dashboard, Admin
 * Paste into the same Apps Script project as Code.gs and Catalog.gs
 */

var WORKFLOW_CONFIG = {
  CREDENTIALS_SHEET: 'Merchant_Credentials',
  SESSIONS_SHEET: 'Merchant_Sessions',
  ADMIN_CREDENTIALS_SHEET: 'Admin_Credentials',
  SESSION_HOURS: 72,
  ROLE_CUSTOMER: 'CUSTOMER',
  ROLE_ADMIN: 'ADMIN',
  STATUS_DRAFT: 'DRAFT',
  STATUS_IN_PROGRESS: 'IN_PROGRESS',
  STATUS_SUBMITTED: 'SUBMITTED',
  STATUS_UNDER_REVIEW: 'UNDER_REVIEW',
  STATUS_REJECTED: 'REJECTED',
  STATUS_RESUBMITTED: 'RESUBMITTED',
  STATUS_APPROVED: 'APPROVED',
  STATUS_GO_LIVE: 'GO_LIVE',
  AGREEMENT_VERSION: '1.0',
};

var WORKFLOW_HEADERS = [
  'Workflow Status',
  'Current Workflow Step',
  'Step 1 Progress',
  'Step 2 Progress',
  'Step 3 Progress',
  'Step 4 Progress',
  'Step 5 Progress',
  'Admin Comments',
  'Agreements Accepted',
  'Agreement Version',
  'Agreement Accepted At',
  'Catalog Skipped',
  'Catalog Skipped At',
  'Store Assets Skipped',
  'Store Assets Skipped At',
  'Merchant Agreement URL',
  'Review Confirmed',
  'Review Confirmed At',
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setupWorkflowInfrastructure() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No spreadsheet bound. Open the script from your sheet: Extensions → Apps Script.');
  }

  Logger.log('setupWorkflowInfrastructure — start');

  Logger.log('Step 1/5: onboarding sheet + headers...');
  setupOnboardingInfrastructure();

  Logger.log('Step 2/5: catalog sheets...');
  setupCatalogInfrastructure();

  Logger.log('Step 3/5: catalog skip columns...');
  ensureCatalogSkipColumns();

  Logger.log('Step 3b/5: store assets skip + agreement columns...');
  ensureStoreAssetsSkipColumns();
  ensureAgreementColumns();
  ensureReviewColumns();

  Logger.log('Step 4/5: credential + session sheets...');
  getOrCreateCredentialsSheet();
  getOrCreateSessionsSheet();
  getOrCreateAdminCredentialsSheet();

  try {
    Logger.log('Step 5/5: normalize credential sheets...');
    fixCredentialsSheetLayout();
  } catch (layoutErr) {
    Logger.log('fixCredentialsSheetLayout warning: ' + layoutErr.message);
  }

  ensureDefaultAdmin();

  Logger.log('setupWorkflowInfrastructure — completed.');
  return {
    credentialsSheet: WORKFLOW_CONFIG.CREDENTIALS_SHEET,
    sessionsSheet: WORKFLOW_CONFIG.SESSIONS_SHEET,
    adminCredentialsSheet: WORKFLOW_CONFIG.ADMIN_CREDENTIALS_SHEET,
    workflowHeadersAppended: WORKFLOW_HEADERS.length,
    catalogSkipColumns: true,
    defaultAdminCreated: true,
  };
}

/**
 * Lightweight setup — only adds Catalog Skipped columns. Run this if full setup fails.
 */
function setupCatalogSkipColumns() {
  ensureCatalogSkipColumns();
  Logger.log('Catalog Skipped + Catalog Skipped At columns ensured on Merchant_Onboarding.');
  return { success: true, message: 'Catalog skip columns ready.' };
}

function ensureCatalogSkipColumns() {
  var sheet = getOrCreateOnboardingSheet().sheet;
  return verifyAndEnsureSheetHeaders(sheet, ['Catalog Skipped', 'Catalog Skipped At']);
}

function ensureStoreAssetsSkipColumns() {
  var sheet = getOrCreateOnboardingSheet().sheet;
  return verifyAndEnsureSheetHeaders(sheet, ['Store Assets Skipped', 'Store Assets Skipped At']);
}

function ensureAgreementColumns() {
  var sheet = getOrCreateOnboardingSheet().sheet;
  return verifyAndEnsureSheetHeaders(sheet, ['Merchant Agreement URL']);
}

function ensureReviewColumns() {
  var sheet = getOrCreateOnboardingSheet().sheet;
  return verifyAndEnsureSheetHeaders(sheet, ['Review Confirmed', 'Review Confirmed At']);
}

function getCredentialsHeaders() {
  return ['Phone', 'Password', 'Merchant Code', 'Onboarding ID', 'Role', 'Active', 'Created At'];
}

function getSessionsHeaders() {
  return ['Session Token', 'Phone', 'Merchant Code', 'Role', 'Created At', 'Expires At'];
}

function getAdminCredentialsHeaders() {
  return ['Phone', 'Password', 'Name', 'Role', 'Active', 'Created At'];
}

function getOrCreateCredentialsSheet() {
  return getOrCreateNamedSheet(WORKFLOW_CONFIG.CREDENTIALS_SHEET, getCredentialsHeaders());
}

function getOrCreateSessionsSheet() {
  return getOrCreateNamedSheet(WORKFLOW_CONFIG.SESSIONS_SHEET, getSessionsHeaders());
}

function getOrCreateAdminCredentialsSheet() {
  return getOrCreateNamedSheet(WORKFLOW_CONFIG.ADMIN_CREDENTIALS_SHEET, getAdminCredentialsHeaders());
}

function getOrCreateNamedSheet(name, headers) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);
  var created = false;
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    created = true;
  }
  if (name === WORKFLOW_CONFIG.CREDENTIALS_SHEET || name === WORKFLOW_CONFIG.ADMIN_CREDENTIALS_SHEET) {
    normalizeCredentialsSheet(sheet, headers);
  } else {
    verifyAndEnsureSheetHeaders(sheet, headers);
  }
  return { sheet: sheet, created: created };
}

function ensureDefaultAdmin() {
  var sheet = getOrCreateAdminCredentialsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  if (sheet.getLastRow() > 1) return;

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  var row = headers.map(function (h) {
    var map = {
      Phone: '9999999999',
      Password: 'admin123',
      Name: 'ELVA Admin',
      Role: WORKFLOW_CONFIG.ROLE_ADMIN,
      Active: 'TRUE',
      'Created At': now,
    };
    return map[h] !== undefined ? map[h] : '';
  });
  sheet.appendRow(row);
  Logger.log('Default admin created: phone 9999999999 / password admin123 — change immediately.');
}

// ---------------------------------------------------------------------------
// Password (plain text in sheet) & session
// ---------------------------------------------------------------------------

/**
 * Run this to fix duplicate Password / Password Hash columns in credential sheets.
 */
function fixCredentialsSheetLayout() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('No active spreadsheet');

  var merchantSheet = spreadsheet.getSheetByName(WORKFLOW_CONFIG.CREDENTIALS_SHEET);
  if (merchantSheet) {
    normalizeCredentialsSheet(merchantSheet, getCredentialsHeaders());
  }

  var adminSheet = spreadsheet.getSheetByName(WORKFLOW_CONFIG.ADMIN_CREDENTIALS_SHEET);
  if (adminSheet) {
    normalizeCredentialsSheet(adminSheet, getAdminCredentialsHeaders());
    ensureAdminPlainPassword(adminSheet);
  }

  Logger.log('Credentials sheets normalized: single Password column, no Password Hash.');
  return { success: true, message: 'Admin_Credentials and Merchant_Credentials columns fixed.' };
}

/**
 * Rebuilds a credentials sheet with canonical headers only (removes Password Hash duplicates).
 */
function normalizeCredentialsSheet(sheet, requiredHeaders) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastCol < 1 || lastRow < 1) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    applySheetFormatting(sheet, requiredHeaders.length);
    return;
  }

  var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var existingHeaders = allData[0].map(function (v) {
    return String(v || '').trim();
  });

  var dataRows = [];
  for (var r = 1; r < allData.length; r++) {
    var rowObj = {};
    var hasData = false;
    existingHeaders.forEach(function (header, colIdx) {
      if (!header) return;
      var val = allData[r][colIdx];
      rowObj[header] = val;
      if (val !== '' && val !== null && val !== undefined) hasData = true;
    });
    if (hasData) dataRows.push(rowObj);
  }

  var normalizedRows = dataRows.map(function (rowObj) {
    return mapCredentialRowToCanonical(rowObj, requiredHeaders);
  });

  sheet.clear();
  sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);

  if (normalizedRows.length > 0) {
    sheet.getRange(2, 1, normalizedRows.length, requiredHeaders.length).setValues(normalizedRows);
  }

  applySheetFormatting(sheet, requiredHeaders.length);
}

function mapCredentialRowToCanonical(rowObj, requiredHeaders) {
  var plainPassword = String(rowObj['Password'] || '').trim();
  var hashPassword = String(rowObj['Password Hash'] || '').trim();

  var password = '';
  if (plainPassword && !looksLikeHash(plainPassword)) {
    password = plainPassword;
  } else if (hashPassword && !looksLikeHash(hashPassword)) {
    password = hashPassword;
  }

  var mapped = {};
  requiredHeaders.forEach(function (header) {
    if (header === 'Password') {
      mapped[header] = password;
    } else if (rowObj[header] !== undefined && rowObj[header] !== null) {
      mapped[header] = rowObj[header];
    } else {
      mapped[header] = '';
    }
  });

  return requiredHeaders.map(function (header) {
    return mapped[header] !== undefined ? mapped[header] : '';
  });
}

function ensureAdminPlainPassword(sheet) {
  var headers = readExistingHeaders(sheet);
  var passIdx = headers.indexOf('Password');
  if (passIdx === -1 || sheet.getLastRow() < 2) return;

  var current = String(sheet.getRange(2, passIdx + 1).getValue() || '').trim();
  if (!current || looksLikeHash(current)) {
    sheet.getRange(2, passIdx + 1).setValue('admin123');
    Logger.log('Admin password set to plain text: admin123');
  }
}

function looksLikeHash(value) {
  var s = String(value || '');
  return s.length > 20 && (s.indexOf('+') !== -1 || s.indexOf('/') !== -1 || s.indexOf('=') !== -1);
}

function getPasswordColumnIndex(headers) {
  return headers.indexOf('Password');
}

function getPasswordFromRow(headers, row) {
  var passwordIdx = headers.indexOf('Password');
  if (passwordIdx !== -1) {
    return String(row[passwordIdx] || '');
  }
  var legacyIdx = headers.indexOf('Password Hash');
  if (legacyIdx !== -1) {
    return String(row[legacyIdx] || '');
  }
  return '';
}

function verifyPassword(password, stored) {
  return String(password) === String(stored);
}

function createSession(phone, merchantCode, role) {
  var sheet = getOrCreateSessionsSheet().sheet;
  var token = Utilities.getUuid();
  var now = new Date();
  var expires = new Date(now.getTime() + WORKFLOW_CONFIG.SESSION_HOURS * 60 * 60 * 1000);
  var tz = Session.getScriptTimeZone();
  var fmt = "yyyy-MM-dd'T'HH:mm:ssXXX";

  sheet.appendRow([
    token,
    phone,
    merchantCode || '',
    role,
    Utilities.formatDate(now, tz, fmt),
    Utilities.formatDate(expires, tz, fmt),
  ]);

  return { token: token, expiresAt: Utilities.formatDate(expires, tz, fmt) };
}

function validateSessionToken(token) {
  if (!token) throw new Error('Session token required');

  var sheet = getOrCreateSessionsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Invalid session');

  var tokenCol = headers.indexOf('Session Token');
  var phoneCol = headers.indexOf('Phone');
  var merchantCol = headers.indexOf('Merchant Code');
  var roleCol = headers.indexOf('Role');
  var expiresCol = headers.indexOf('Expires At');

  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][tokenCol]) === token) {
      var expiresAt = new Date(values[i][expiresCol]);
      if (expiresAt < new Date()) throw new Error('Session expired. Please log in again.');
      return {
        phone: String(values[i][phoneCol]),
        merchantCode: String(values[i][merchantCol] || ''),
        role: String(values[i][roleCol] || WORKFLOW_CONFIG.ROLE_CUSTOMER),
      };
    }
  }
  throw new Error('Invalid session');
}

function destroySession(token) {
  var sheet = getOrCreateSessionsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var tokenCol = headers.indexOf('Session Token') + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  for (var row = lastRow; row >= 2; row--) {
    if (String(sheet.getRange(row, tokenCol).getValue()) === token) {
      sheet.deleteRow(row);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Auth handlers
// ---------------------------------------------------------------------------

function handleRegister(data) {
  if (!data.phone || !data.password) throw new Error('Phone and password are required');
  if (String(data.password).length < 6) throw new Error('Password must be at least 6 characters');

  var phone = normalizePhone(data.phone);
  if (findCredentialByPhone(phone)) throw new Error('Phone number already registered');

  setupWorkflowInfrastructure();

  var sheet = getOrCreateOnboardingSheet().sheet;
  var onboardingId = generateOnboardingId(sheet);
  var merchantCode = generateMerchantCode(sheet);
  var storeCode = generateStoreCode(sheet);
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");

  var rootFolder = getOrCreateDriveFolder().folder;
  rootFolder.createFolder(onboardingId);

  var valuesByHeader = buildDraftValuesByHeader(onboardingId, merchantCode, storeCode, phone, now);
  appendOnboardingRow(sheet, valuesByHeader);

  appendCredential(phone, data.password, merchantCode, onboardingId, WORKFLOW_CONFIG.ROLE_CUSTOMER);

  var session = createSession(phone, merchantCode, WORKFLOW_CONFIG.ROLE_CUSTOMER);

  return createJsonResponse({
    success: true,
    sessionToken: session.token,
    expiresAt: session.expiresAt,
    merchantCode: merchantCode,
    storeCode: storeCode,
    onboardingId: onboardingId,
    workflowStatus: WORKFLOW_CONFIG.STATUS_DRAFT,
  });
}

function handleLogin(data) {
  if (!data.phone || !data.password) throw new Error('Phone and password are required');

  var phone = normalizePhone(data.phone);
  var cred = findCredentialByPhone(phone);
  if (!cred) throw new Error('Invalid phone or password');
  if (String(cred.active).toUpperCase() !== 'TRUE') throw new Error('Account is inactive');
  if (!verifyPassword(data.password, cred.password)) throw new Error('Invalid phone or password');

  var session = createSession(phone, cred.merchantCode, cred.role);
  var merchant = cred.merchantCode ? findMerchantByCode(cred.merchantCode) : null;

  return createJsonResponse({
    success: true,
    sessionToken: session.token,
    expiresAt: session.expiresAt,
    role: cred.role,
    merchantCode: cred.merchantCode,
    storeCode: merchant ? merchant.storeCode : '',
    onboardingId: cred.onboardingId,
    workflowStatus: merchant ? getWorkflowStatusFromRow(merchant) : WORKFLOW_CONFIG.STATUS_DRAFT,
  });
}

function handleLogout(data) {
  if (data.sessionToken) destroySession(data.sessionToken);
  return createJsonResponse({ success: true });
}

function handleGetSession(data) {
  var session = validateSessionToken(data.sessionToken);
  var merchant = session.merchantCode ? findMerchantByCode(session.merchantCode) : null;

  return createJsonResponse({
    success: true,
    phone: session.phone,
    role: session.role,
    merchantCode: session.merchantCode,
    storeCode: merchant ? merchant.storeCode : '',
    onboardingId: merchant ? merchant.onboardingId : '',
    workflowStatus: merchant ? getWorkflowStatusFromRow(merchant) : WORKFLOW_CONFIG.STATUS_DRAFT,
    isReadOnly: merchant ? isWorkflowReadOnly(getWorkflowStatusFromRow(merchant)) : false,
  });
}

function handleAdminLogin(data) {
  if (!data.phone || !data.password) throw new Error('Phone and password are required');

  var phone = normalizePhone(data.phone);
  var admin = findAdminByPhone(phone);
  if (!admin) throw new Error('Invalid admin credentials');
  if (!verifyPassword(data.password, admin.password)) throw new Error('Invalid admin credentials');

  var session = createSession(phone, '', WORKFLOW_CONFIG.ROLE_ADMIN);

  return createJsonResponse({
    success: true,
    sessionToken: session.token,
    expiresAt: session.expiresAt,
    role: WORKFLOW_CONFIG.ROLE_ADMIN,
    name: admin.name,
  });
}

// ---------------------------------------------------------------------------
// Dashboard & workflow save
// ---------------------------------------------------------------------------

function handleGetDashboard(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_CUSTOMER) throw new Error('Customer access only');
  if (!session.merchantCode) throw new Error('No merchant linked to session');

  var merchant = findMerchantByCode(session.merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  var progress = calculateWorkflowProgress(session.merchantCode, merchant);
  var workflowStatus = getWorkflowStatusFromRow(merchant);

  return createJsonResponse({
    success: true,
    dashboard: {
      merchantCode: merchant.merchantCode,
      storeCode: merchant.storeCode,
      onboardingId: merchant.onboardingId,
      storeName: merchant.storeName,
      workflowStatus: workflowStatus,
      currentStep: Number(merchant.currentWorkflowStep) || 1,
      isReadOnly: isWorkflowReadOnly(workflowStatus),
      canEdit: canEditWorkflow(workflowStatus),
      adminComments: String(merchant.adminComments || ''),
      steps: progress.steps,
      overallProgress: progress.overall,
      agreementsAccepted: String(merchant.agreementsAccepted || '').toUpperCase() === 'TRUE',
      catalogSkipped: String(merchant.catalogSkipped || '').toUpperCase() === 'TRUE',
      storeAssetsSkipped: String(merchant.storeAssetsSkipped || '').toUpperCase() === 'TRUE',
      reviewConfirmed: String(merchant.reviewConfirmed || '').toUpperCase() === 'TRUE',
    },
    formData: merchantRowToFormData(merchant),
  });
}

function handleSaveWorkflowStep(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_CUSTOMER) throw new Error('Customer access only');

  var merchant = findMerchantByCode(session.merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  var workflowStatus = getWorkflowStatusFromRow(merchant);
  if (!canEditWorkflow(workflowStatus)) {
    throw new Error('Submission is locked. Status: ' + workflowStatus);
  }

  var step = Number(data.step) || 1;
  var fields = data.data || data.fields || {};

  upsertMerchantWorkflowData(session.merchantCode, fields, step, false);

  var updated = findMerchantByCode(session.merchantCode);
  var progress = calculateWorkflowProgress(session.merchantCode, updated);

  return createJsonResponse({
    success: true,
    step: step,
    workflowStatus: getWorkflowStatusFromRow(updated),
    steps: progress.steps,
    overallProgress: progress.overall,
  });
}

function handleSkipCatalogStep(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_CUSTOMER) throw new Error('Customer access only');
  if (!session.merchantCode) throw new Error('No merchant linked to session');

  var merchant = findMerchantByCode(session.merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  if (!canEditWorkflow(getWorkflowStatusFromRow(merchant))) {
    throw new Error('Submission is locked');
  }

  ensureCatalogSkipColumns();

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  updateMerchantFields(session.merchantCode, {
    'Catalog Skipped': 'TRUE',
    'Catalog Skipped At': now,
    'Step 3 Progress': '100%',
    'Current Workflow Step': 4,
    'Workflow Status': WORKFLOW_CONFIG.STATUS_IN_PROGRESS,
  });

  var updated = findMerchantByCode(session.merchantCode);
  var progress = calculateWorkflowProgress(session.merchantCode, updated);

  return createJsonResponse({
    success: true,
    catalogSkipped: true,
    steps: progress.steps,
    overallProgress: progress.overall,
  });
}

function handleSkipStoreAssetsStep(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_CUSTOMER) throw new Error('Customer access only');
  if (!session.merchantCode) throw new Error('No merchant linked to session');

  var merchant = findMerchantByCode(session.merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  if (!canEditWorkflow(getWorkflowStatusFromRow(merchant))) {
    throw new Error('Submission is locked');
  }

  ensureStoreAssetsSkipColumns();

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  updateMerchantFields(session.merchantCode, {
    'Store Assets Skipped': 'TRUE',
    'Store Assets Skipped At': now,
    'Workflow Status': WORKFLOW_CONFIG.STATUS_IN_PROGRESS,
  });

  var updated = findMerchantByCode(session.merchantCode);
  var progress = calculateWorkflowProgress(session.merchantCode, updated);

  return createJsonResponse({
    success: true,
    storeAssetsSkipped: true,
    steps: progress.steps,
    overallProgress: progress.overall,
  });
}

function handleConfirmDataReview(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_CUSTOMER) throw new Error('Customer access only');
  if (!session.merchantCode) throw new Error('No merchant linked to session');
  if (!data.confirmed) throw new Error('Review confirmation is required');

  var merchant = findMerchantByCode(session.merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  if (!canEditWorkflow(getWorkflowStatusFromRow(merchant))) {
    throw new Error('Submission is locked');
  }

  ensureReviewColumns();

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  updateMerchantFields(session.merchantCode, {
    'Review Confirmed': 'TRUE',
    'Review Confirmed At': now,
    'Workflow Status': WORKFLOW_CONFIG.STATUS_IN_PROGRESS,
  });

  var updated = findMerchantByCode(session.merchantCode);
  var progress = calculateWorkflowProgress(session.merchantCode, updated);

  return createJsonResponse({
    success: true,
    reviewConfirmed: true,
    steps: progress.steps,
    overallProgress: progress.overall,
  });
}

function handleSaveAgreements(data) {
  var session = validateSessionToken(data.sessionToken);
  if (!data.accepted) throw new Error('Agreements must be accepted');

  var merchant = findMerchantByCode(session.merchantCode);
  if (!merchant) throw new Error('Merchant not found');
  if (!canEditWorkflow(getWorkflowStatusFromRow(merchant))) {
    throw new Error('Submission is locked');
  }

  ensureAgreementColumns();

  var agreementUrl = String(merchant.merchantAgreementUrl || '').trim();
  if (data.merchantAgreement) {
    var onboardingId = merchant.onboardingId;
    var rootFolder = getOrCreateDriveFolder().folder;
    var onboardingFolders = rootFolder.getFoldersByName(onboardingId);
    var onboardingFolder = onboardingFolders.hasNext() ? onboardingFolders.next() : rootFolder.createFolder(onboardingId);
    var agreementsFolder = getOrCreateSubfolder(onboardingFolder, 'Agreements');
    agreementUrl = uploadFileToFolder(data.merchantAgreement, agreementsFolder, 'merchant-agreement');
  }

  if (!agreementUrl) {
    throw new Error('Signed merchant agreement file is required');
  }

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  var updates = {
    'Agreements Accepted': 'TRUE',
    'Agreement Version': WORKFLOW_CONFIG.AGREEMENT_VERSION,
    'Agreement Accepted At': now,
    'Merchant Agreement URL': agreementUrl,
    'Current Workflow Step': 5,
    'Workflow Status': WORKFLOW_CONFIG.STATUS_IN_PROGRESS,
  };
  updateMerchantFields(session.merchantCode, updates);

  var updated = findMerchantByCode(session.merchantCode);
  var progress = calculateWorkflowProgress(session.merchantCode, updated);

  return createJsonResponse({
    success: true,
    steps: progress.steps,
    overallProgress: progress.overall,
  });
}

function handleSubmitWorkflow(data) {
  var session = validateSessionToken(data.sessionToken);
  var merchant = findMerchantByCode(session.merchantCode);
  var workflowStatus = getWorkflowStatusFromRow(merchant);

  if (!canEditWorkflow(workflowStatus)) {
    throw new Error('Submission is locked. Status: ' + workflowStatus);
  }

  var fields = data.data || {};
  upsertMerchantWorkflowData(session.merchantCode, fields, 5, true);

  var newStatus =
    workflowStatus === WORKFLOW_CONFIG.STATUS_REJECTED
      ? WORKFLOW_CONFIG.STATUS_RESUBMITTED
      : WORKFLOW_CONFIG.STATUS_SUBMITTED;

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  updateMerchantFields(session.merchantCode, {
    'Workflow Status': newStatus,
    Status: WORKFLOW_CONFIG.STATUS_SUBMITTED,
    'Review Status': WORKFLOW_CONFIG.STATUS_SUBMITTED,
    'Submitted At': now,
    'Current Workflow Step': 5,
    'Admin Comments': '',
  });

  var updated = findMerchantByCode(session.merchantCode);
  var progress = calculateWorkflowProgress(session.merchantCode, updated);

  return createJsonResponse({
    success: true,
    onboardingId: updated.onboardingId,
    merchantCode: updated.merchantCode,
    storeCode: updated.storeCode,
    workflowStatus: getWorkflowStatusFromRow(updated),
    completionPercentage: progress.overall,
  });
}

// ---------------------------------------------------------------------------
// Admin handlers
// ---------------------------------------------------------------------------

function handleAdminListMerchants(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_ADMIN) throw new Error('Admin access required');

  var sheet = getOrCreateOnboardingSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return createJsonResponse({ success: true, merchants: [] });

  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  var merchants = values.map(function (row) {
    var m = rowToMerchantObject(headers, row);
    var progress = calculateWorkflowProgress(m.merchantCode, m);
    return {
      merchantCode: m.merchantCode,
      storeCode: m.storeCode,
      onboardingId: m.onboardingId,
      storeName: m.storeName,
      ownerName: m.ownerName,
      primaryPhone: m.primaryPhone,
      workflowStatus: getWorkflowStatusFromRow(m),
      overallProgress: progress.overall,
      submittedAt: m.submittedAt,
    };
  });

  return createJsonResponse({ success: true, merchants: merchants });
}

function handleAdminGetMerchant(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_ADMIN) throw new Error('Admin access required');
  if (!data.merchantCode) throw new Error('merchantCode required');

  var merchant = findMerchantByCode(data.merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  var progress = calculateWorkflowProgress(data.merchantCode, merchant);
  var products = getProductsForMerchant(getOrCreateProductsSheet().sheet, data.merchantCode);

  return createJsonResponse({
    success: true,
    merchant: merchant,
    workflowStatus: getWorkflowStatusFromRow(merchant),
    steps: progress.steps,
    overallProgress: progress.overall,
    formData: merchantRowToFormData(merchant),
    productCount: products.length,
    products: products.slice(0, 50),
  });
}

function handleAdminReviewMerchant(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_ADMIN) throw new Error('Admin access required');
  if (!data.merchantCode || !data.action) throw new Error('merchantCode and action required');

  var action = String(data.action).toUpperCase();
  var comments = String(data.comments || '');
  var updates = {};

  if (action === 'REJECT') {
    if (!comments) throw new Error('Rejection comments are required');
    updates['Workflow Status'] = WORKFLOW_CONFIG.STATUS_REJECTED;
    updates['Review Status'] = WORKFLOW_CONFIG.STATUS_REJECTED;
    updates['Admin Comments'] = comments;
    updates['Internal Notes'] = comments;
  } else if (action === 'APPROVE') {
    updates['Workflow Status'] = WORKFLOW_CONFIG.STATUS_APPROVED;
    updates['Review Status'] = WORKFLOW_CONFIG.STATUS_APPROVED;
    updates['Go Live Status'] = 'READY';
    updates['Admin Comments'] = comments || 'Approved';
  } else if (action === 'UNDER_REVIEW') {
    updates['Workflow Status'] = WORKFLOW_CONFIG.STATUS_UNDER_REVIEW;
    updates['Review Status'] = WORKFLOW_CONFIG.STATUS_UNDER_REVIEW;
  } else if (action === 'GO_LIVE') {
    updates['Workflow Status'] = WORKFLOW_CONFIG.STATUS_GO_LIVE;
    updates['Go Live Status'] = 'LIVE';
    updates['Go Live Date'] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } else {
    throw new Error('Unknown action: ' + action);
  }

  updateMerchantFields(data.merchantCode, updates);

  return createJsonResponse({
    success: true,
    merchantCode: data.merchantCode,
    workflowStatus: updates['Workflow Status'],
  });
}

function handleAdminUpdateMerchant(data) {
  var session = validateSessionToken(data.sessionToken);
  if (session.role !== WORKFLOW_CONFIG.ROLE_ADMIN) throw new Error('Admin access required');
  if (!data.merchantCode || !data.fields) throw new Error('merchantCode and fields required');

  var merchant = findMerchantByCode(data.merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  adminApplyMerchantFields(data.merchantCode, data.fields);

  var updated = findMerchantByCode(data.merchantCode);
  var progress = calculateWorkflowProgress(data.merchantCode, updated);

  updateMerchantFields(data.merchantCode, {
    'Step 1 Progress': progress.steps[0].progress + '%',
    'Step 2 Progress': progress.steps[1].progress + '%',
    'Step 3 Progress': progress.steps[2].progress + '%',
    'Step 4 Progress': progress.steps[3].progress + '%',
    'Step 5 Progress': progress.steps[4].progress + '%',
    'Completion Percentage': progress.overall + '%',
  });

  return createJsonResponse({
    success: true,
    merchantCode: data.merchantCode,
    workflowStatus: getWorkflowStatusFromRow(updated),
    steps: progress.steps,
    overallProgress: progress.overall,
    formData: merchantRowToFormData(updated),
  });
}

function adminApplyMerchantFields(merchantCode, data) {
  var valuesMap = mapPayloadToSheetValues(data, {});

  if (data.catalogSkipped !== undefined) {
    valuesMap['Catalog Skipped'] = data.catalogSkipped ? 'TRUE' : 'FALSE';
  }
  if (data.adminComments !== undefined) {
    valuesMap['Admin Comments'] = data.adminComments;
  }
  if (data.goLiveStatus !== undefined) {
    valuesMap['Go Live Status'] = data.goLiveStatus;
  }

  var cleaned = {};
  Object.keys(valuesMap).forEach(function (key) {
    if (valuesMap[key] !== undefined && valuesMap[key] !== null) {
      cleaned[key] = valuesMap[key];
    }
  });

  updateMerchantFields(merchantCode, cleaned);
}

// ---------------------------------------------------------------------------
// Merchant data helpers
// ---------------------------------------------------------------------------

function buildDraftValuesByHeader(onboardingId, merchantCode, storeCode, phone, now) {
  return {
    'Onboarding ID': onboardingId,
    Status: WORKFLOW_CONFIG.STATUS_DRAFT,
    'Review Status': WORKFLOW_CONFIG.STATUS_DRAFT,
    'Internal Notes': '',
    'Submitted At': '',
    'Store Name': '',
    'Primary Phone': phone,
    'Merchant Code': merchantCode,
    'Store Code': storeCode,
    'Workflow Status': WORKFLOW_CONFIG.STATUS_DRAFT,
    'Current Workflow Step': 1,
    'Step 1 Progress': '0%',
    'Step 2 Progress': '0%',
    'Step 3 Progress': '0%',
    'Step 4 Progress': '0%',
    'Step 5 Progress': '0%',
    'Admin Comments': '',
    'Agreements Accepted': 'FALSE',
    'Agreement Version': '',
    'Agreement Accepted At': '',
    'Go Live Status': 'PENDING',
    'Completion Percentage': '0%',
  };
}

function getWorkflowStatusFromRow(merchant) {
  if (merchant.workflowStatus) return merchant.workflowStatus;
  if (merchant.reviewStatus) return merchant.reviewStatus;
  return WORKFLOW_CONFIG.STATUS_DRAFT;
}

function isWorkflowReadOnly(status) {
  return (
    status === WORKFLOW_CONFIG.STATUS_SUBMITTED ||
    status === WORKFLOW_CONFIG.STATUS_UNDER_REVIEW ||
    status === WORKFLOW_CONFIG.STATUS_RESUBMITTED ||
    status === WORKFLOW_CONFIG.STATUS_APPROVED ||
    status === WORKFLOW_CONFIG.STATUS_GO_LIVE
  );
}

function canEditWorkflow(status) {
  return (
    status === WORKFLOW_CONFIG.STATUS_DRAFT ||
    status === WORKFLOW_CONFIG.STATUS_IN_PROGRESS ||
    status === WORKFLOW_CONFIG.STATUS_REJECTED
  );
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function findCredentialByPhone(phone) {
  var sheet = getOrCreateCredentialsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var phoneCol = headers.indexOf('Phone');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][phoneCol]) === phone) {
      return {
        phone: phone,
        password: getPasswordFromRow(headers, values[i]),
        merchantCode: String(values[i][headers.indexOf('Merchant Code')]),
        onboardingId: String(values[i][headers.indexOf('Onboarding ID')]),
        role: String(values[i][headers.indexOf('Role')]),
        active: String(values[i][headers.indexOf('Active')]),
      };
    }
  }
  return null;
}

function findAdminByPhone(phone) {
  var sheet = getOrCreateAdminCredentialsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var phoneCol = headers.indexOf('Phone');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][phoneCol]) === phone) {
      return {
        phone: phone,
        password: getPasswordFromRow(headers, values[i]),
        name: String(values[i][headers.indexOf('Name')]),
      };
    }
  }
  return null;
}

function appendCredential(phone, password, merchantCode, onboardingId, role) {
  var sheet = getOrCreateCredentialsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  var row = headers.map(function (h) {
    var map = {
      Phone: phone,
      Password: String(password),
      'Merchant Code': merchantCode,
      'Onboarding ID': onboardingId,
      Role: role,
      Active: 'TRUE',
      'Created At': now,
    };
    return map[h] !== undefined ? map[h] : '';
  });
  sheet.appendRow(row);
}

function updateMerchantFields(merchantCode, fieldMap) {
  var sheet = getOrCreateOnboardingSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var rowIndex = findMerchantRowIndex(sheet, headers, merchantCode);
  if (rowIndex < 0) throw new Error('Merchant row not found');

  Object.keys(fieldMap).forEach(function (header) {
    var col = headers.indexOf(header);
    if (col !== -1) sheet.getRange(rowIndex, col + 1).setValue(fieldMap[header]);
  });
}

function findMerchantRowIndex(sheet, headers, merchantCode) {
  var merchantCol = headers.indexOf('Merchant Code') + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  for (var row = 2; row <= lastRow; row++) {
    if (String(sheet.getRange(row, merchantCol).getValue()).trim() === merchantCode) return row;
  }
  return -1;
}

function upsertMerchantWorkflowData(merchantCode, data, step, isFinalSubmit) {
  var merchant = findMerchantByCode(merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  var onboardingId = merchant.onboardingId;
  var rootFolder = getOrCreateDriveFolder().folder;
  var onboardingFolders = rootFolder.getFoldersByName(onboardingId);
  var onboardingFolder = onboardingFolders.hasNext() ? onboardingFolders.next() : rootFolder.createFolder(onboardingId);

  var brandingFolder = getOrCreateSubfolder(onboardingFolder, 'Branding');
  var documentsFolder = getOrCreateSubfolder(onboardingFolder, 'Documents');
  var assetsFolder = getOrCreateSubfolder(onboardingFolder, 'StoreAssets');

  var fileUrls = {};
  if (data.logo) fileUrls.logoUrl = uploadFileToFolder(data.logo, brandingFolder, 'logo');
  if (data.banner) fileUrls.bannerUrl = uploadFileToFolder(data.banner, brandingFolder, 'banner');
  if (data.gstCertificate) fileUrls.gstCertificateUrl = uploadFileToFolder(data.gstCertificate, documentsFolder, 'gst');
  if (data.panCard) fileUrls.panCardUrl = uploadFileToFolder(data.panCard, documentsFolder, 'pan');
  if (data.fssaiLicense) fileUrls.fssaiLicenseUrl = uploadFileToFolder(data.fssaiLicense, documentsFolder, 'fssai');
  if (data.businessRegistration)
    fileUrls.businessRegistrationUrl = uploadFileToFolder(data.businessRegistration, documentsFolder, 'registration');
  if (data.storeFrontPhoto) fileUrls.storeFrontPhotoUrl = uploadFileToFolder(data.storeFrontPhoto, assetsFolder, 'storefront');
  if (data.storeInteriorPhoto)
    fileUrls.storeInteriorPhotoUrl = uploadFileToFolder(data.storeInteriorPhoto, assetsFolder, 'interior');

  var flatData = Object.assign({}, data, fileUrls);
  var valuesMap = mapPayloadToSheetValues(flatData, fileUrls);

  var sheet = getOrCreateOnboardingSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var rowIndex = findMerchantRowIndex(sheet, headers, merchantCode);

  Object.keys(valuesMap).forEach(function (header) {
    var col = headers.indexOf(header);
    if (col !== -1 && valuesMap[header] !== undefined && valuesMap[header] !== null) {
      sheet.getRange(rowIndex, col + 1).setValue(valuesMap[header]);
    }
  });

  var updated = findMerchantByCode(merchantCode);
  var progress = calculateWorkflowProgress(merchantCode, updated);

  updateMerchantFields(merchantCode, {
    'Workflow Status': isFinalSubmit
      ? WORKFLOW_CONFIG.STATUS_SUBMITTED
      : WORKFLOW_CONFIG.STATUS_IN_PROGRESS,
    'Current Workflow Step': step,
    'Step 1 Progress': progress.steps[0].progress + '%',
    'Step 2 Progress': progress.steps[1].progress + '%',
    'Step 3 Progress': progress.steps[2].progress + '%',
    'Step 4 Progress': progress.steps[3].progress + '%',
    'Step 5 Progress': progress.steps[4].progress + '%',
    'Completion Percentage': progress.overall + '%',
  });
}

function mapPayloadToSheetValues(data, fileUrls) {
  var map = {
    'Store Name': data.storeName,
    'Business Name': data.businessName,
    'Owner Name': data.ownerName,
    'GST Number': data.gstNumber,
    'PAN Number': data.panNumber,
    'Primary Phone': data.primaryPhone,
    'Secondary Phone': data.secondaryPhone,
    'Email Address': data.emailAddress,
    'Store Address': data.storeAddress,
    Landmark: data.landmark,
    City: data.city,
    State: data.state,
    Pincode: data.pincode,
    Latitude: data.latitude,
    Longitude: data.longitude,
    'Delivery Radius': data.deliveryRadius,
    'Minimum Order Amount': data.minimumOrderAmount,
    'Delivery Charge': data.deliveryCharge,
    'Free Delivery Above': data.freeDeliveryAbove,
    'COD Enabled': data.codEnabled === true || data.codEnabled === 'true' ? 'TRUE' : data.codEnabled === false ? 'FALSE' : data.codEnabled,
    'Online Payment Enabled':
      data.onlinePaymentEnabled === true || data.onlinePaymentEnabled === 'true'
        ? 'TRUE'
        : data.onlinePaymentEnabled === false
          ? 'FALSE'
          : data.onlinePaymentEnabled,
    'Monday Open': data.mondayOpen,
    'Monday Close': data.mondayClose,
    'Tuesday Open': data.tuesdayOpen,
    'Tuesday Close': data.tuesdayClose,
    'Wednesday Open': data.wednesdayOpen,
    'Wednesday Close': data.wednesdayClose,
    'Thursday Open': data.thursdayOpen,
    'Thursday Close': data.thursdayClose,
    'Friday Open': data.fridayOpen,
    'Friday Close': data.fridayClose,
    'Saturday Open': data.saturdayOpen,
    'Saturday Close': data.saturdayClose,
    'Sunday Open': data.sundayOpen,
    'Sunday Close': data.sundayClose,
    'Store Description': data.storeDescription,
    'Brand Color': data.brandColor,
    'Logo URL': fileUrls.logoUrl || data.logoUrl,
    'Banner URL': fileUrls.bannerUrl || data.bannerUrl,
    'Admin Name': data.adminName,
    'Admin Email': data.adminEmail,
    'Admin Phone': data.adminPhone,
    'WhatsApp Number': data.whatsappNumber,
    'Support Phone': data.supportPhone,
    'Support Email': data.supportEmail,
    'GST Certificate URL': fileUrls.gstCertificateUrl || data.gstCertificateUrl,
    'PAN Card URL': fileUrls.panCardUrl || data.panCardUrl,
    'FSSAI License URL': fileUrls.fssaiLicenseUrl || data.fssaiLicenseUrl,
    'Business Registration URL': fileUrls.businessRegistrationUrl || data.businessRegistrationUrl,
    'Account Holder Name': data.accountHolderName,
    'Bank Name': data.bankName,
    'Account Number': data.accountNumber,
    'IFSC Code': data.ifscCode,
    'UPI ID': data.upiId,
    'Delivery Model': data.deliveryModel,
    'Estimated Delivery Time': data.estimatedDeliveryTime,
    'Store Front Photo URL': fileUrls.storeFrontPhotoUrl || data.storeFrontPhotoUrl,
    'Store Interior Photo URL': fileUrls.storeInteriorPhotoUrl || data.storeInteriorPhotoUrl,
  };

  var cleaned = {};
  Object.keys(map).forEach(function (key) {
    if (map[key] !== undefined && map[key] !== null && map[key] !== '') cleaned[key] = map[key];
  });
  return cleaned;
}

function formatSheetTime(value) {
  if (value === null || value === undefined || value === '') return '';
  if (String(value).toUpperCase() === 'CLOSED') return 'CLOSED';
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }
  var str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    try {
      return Utilities.formatDate(new Date(str), Session.getScriptTimeZone(), 'HH:mm');
    } catch (e) {
      // fall through
    }
  }
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    var parts = str.split(':');
    return ('0' + parts[0]).slice(-2) + ':' + parts[1];
  }
  var ampm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    var hour = parseInt(ampm[1], 10);
    var minute = ampm[2];
    if (ampm[3].toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (ampm[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
    return ('0' + hour).slice(-2) + ':' + minute;
  }
  var loose = str.match(/(\d{1,2}):(\d{2})/);
  if (loose) {
    return ('0' + loose[1]).slice(-2) + ':' + loose[2];
  }
  return str;
}

function parseDayTiming(openVal, closeVal) {
  var openStr = formatSheetTime(openVal);
  var closeStr = formatSheetTime(closeVal);
  if (openStr.toUpperCase() === 'CLOSED' || closeStr.toUpperCase() === 'CLOSED') {
    return { openTime: '09:00', closeTime: '21:00', closed: true };
  }
  return {
    openTime: openStr || '09:00',
    closeTime: closeStr || '21:00',
    closed: false,
  };
}

function merchantRowToFormData(merchant) {
  var headers = merchant.headers;
  var row = merchant.row;

  function val(header) {
    var idx = headers.indexOf(header);
    return idx === -1 ? '' : row[idx];
  }

  return {
    onboardingId: String(val('Onboarding ID') || ''),
    merchantCode: String(val('Merchant Code') || ''),
    storeCode: String(val('Store Code') || ''),
    storeName: String(val('Store Name') || ''),
    businessName: String(val('Business Name') || ''),
    ownerName: String(val('Owner Name') || ''),
    gstNumber: String(val('GST Number') || ''),
    panNumber: String(val('PAN Number') || ''),
    primaryPhone: String(val('Primary Phone') || ''),
    secondaryPhone: String(val('Secondary Phone') || ''),
    emailAddress: String(val('Email Address') || ''),
    storeAddress: String(val('Store Address') || ''),
    landmark: String(val('Landmark') || ''),
    city: String(val('City') || ''),
    state: String(val('State') || ''),
    pincode: String(val('Pincode') || ''),
    latitude: val('Latitude') !== '' ? Number(val('Latitude')) : null,
    longitude: val('Longitude') !== '' ? Number(val('Longitude')) : null,
    deliveryRadius: String(val('Delivery Radius') || ''),
    minimumOrderAmount: String(val('Minimum Order Amount') || ''),
    deliveryCharge: String(val('Delivery Charge') || ''),
    freeDeliveryAbove: String(val('Free Delivery Above') || ''),
    codEnabled: String(val('COD Enabled')).toUpperCase() === 'TRUE',
    onlinePaymentEnabled: String(val('Online Payment Enabled')).toUpperCase() === 'TRUE',
    timings: {
      monday: parseDayTiming(val('Monday Open'), val('Monday Close')),
      tuesday: parseDayTiming(val('Tuesday Open'), val('Tuesday Close')),
      wednesday: parseDayTiming(val('Wednesday Open'), val('Wednesday Close')),
      thursday: parseDayTiming(val('Thursday Open'), val('Thursday Close')),
      friday: parseDayTiming(val('Friday Open'), val('Friday Close')),
      saturday: parseDayTiming(val('Saturday Open'), val('Saturday Close')),
      sunday: parseDayTiming(val('Sunday Open'), val('Sunday Close')),
    },
    storeDescription: String(val('Store Description') || ''),
    brandColor: String(val('Brand Color') || '#2563eb'),
    adminName: String(val('Admin Name') || ''),
    adminEmail: String(val('Admin Email') || ''),
    adminPhone: String(val('Admin Phone') || ''),
    whatsappNumber: String(val('WhatsApp Number') || ''),
    supportPhone: String(val('Support Phone') || ''),
    supportEmail: String(val('Support Email') || ''),
    deliveryModel: String(val('Delivery Model') || ''),
    estimatedDeliveryTime: String(val('Estimated Delivery Time') || ''),
    accountHolderName: String(val('Account Holder Name') || ''),
    bankName: String(val('Bank Name') || ''),
    accountNumber: String(val('Account Number') || ''),
    ifscCode: String(val('IFSC Code') || ''),
    upiId: String(val('UPI ID') || ''),
    logoUrl: String(val('Logo URL') || ''),
    bannerUrl: String(val('Banner URL') || ''),
    gstCertificateUrl: String(val('GST Certificate URL') || ''),
    panCardUrl: String(val('PAN Card URL') || ''),
    fssaiLicenseUrl: String(val('FSSAI License URL') || ''),
    businessRegistrationUrl: String(val('Business Registration URL') || ''),
    storeFrontPhotoUrl: String(val('Store Front Photo URL') || ''),
    storeInteriorPhotoUrl: String(val('Store Interior Photo URL') || ''),
    merchantAgreementUrl: String(val('Merchant Agreement URL') || ''),
    storeAssetsSkipped: String(val('Store Assets Skipped')).toUpperCase() === 'TRUE',
    reviewConfirmed: String(val('Review Confirmed')).toUpperCase() === 'TRUE',
    catalogSkipped: String(val('Catalog Skipped')).toUpperCase() === 'TRUE',
    agreementsAccepted: String(val('Agreements Accepted')).toUpperCase() === 'TRUE',
    adminComments: String(val('Admin Comments') || ''),
    submittedAt: String(val('Submitted At') || ''),
    goLiveStatus: String(val('Go Live Status') || ''),
    goLiveDate: String(val('Go Live Date') || ''),
  };
}

function calculateWorkflowProgress(merchantCode, merchant) {
  var headers = merchant.headers;
  var row = merchant.row;

  function has(header) {
    var idx = headers.indexOf(header);
    return idx !== -1 && String(row[idx] || '').trim() !== '';
  }

  function pct(done, total) {
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }

  var step1CoreFields = [
    'Store Name',
    'Business Name',
    'Owner Name',
    'Primary Phone',
    'Email Address',
    'Store Address',
    'City',
    'State',
    'Pincode',
    'Latitude',
    'Longitude',
    'Delivery Radius',
    'Minimum Order Amount',
    'Delivery Charge',
    'Logo URL',
    'Brand Color',
  ];
  var coreDone = step1CoreFields.filter(has).length;
  var storeAssetsSkipped = String(merchant.storeAssetsSkipped || '').toUpperCase() === 'TRUE';
  var assetsDone =
    storeAssetsSkipped || has('Store Front Photo URL') || has('Store Interior Photo URL');
  var step1Total = step1CoreFields.length + 1;
  var step1Done = coreDone + (assetsDone ? 1 : 0);

  var step2Fields = [
    'Admin Name',
    'Admin Email',
    'Admin Phone',
    'WhatsApp Number',
    'Support Phone',
    'Support Email',
    'Delivery Model',
    'Estimated Delivery Time',
    'PAN Card URL',
    'Account Holder Name',
    'Bank Name',
    'Account Number',
    'IFSC Code',
    'UPI ID',
  ];
  var step2Done = step2Fields.filter(has).length;

  var products = [];
  try {
    products = getProductsForMerchant(getOrCreateProductsSheet().sheet, merchantCode);
  } catch (e) {
    products = [];
  }
  var productsWithImages = products.filter(function (p) {
    return p.imageUrl;
  }).length;
  var catalogSkipped = String(merchant.catalogSkipped || '').toUpperCase() === 'TRUE';
  var step3Progress = catalogSkipped
    ? 100
    : products.length === 0
      ? 0
      : pct(productsWithImages, products.length);

  var step4Progress = String(merchant.agreementsAccepted || '').toUpperCase() === 'TRUE' ? 100 : 0;
  var reviewConfirmed = String(merchant.reviewConfirmed || '').toUpperCase() === 'TRUE';

  var step5Progress = 0;
  var status = getWorkflowStatusFromRow(merchant);
  if (
    status === WORKFLOW_CONFIG.STATUS_SUBMITTED ||
    status === WORKFLOW_CONFIG.STATUS_UNDER_REVIEW ||
    status === WORKFLOW_CONFIG.STATUS_RESUBMITTED ||
    status === WORKFLOW_CONFIG.STATUS_APPROVED ||
    status === WORKFLOW_CONFIG.STATUS_GO_LIVE
  ) {
    step5Progress = 100;
  } else if (step1Done >= 16 && step2Done >= 12 && (step3Progress >= 80 || catalogSkipped) && step4Progress === 100) {
    step5Progress = reviewConfirmed ? 100 : 50;
  }

  var steps = [
    { step: 1, title: 'Store Information', progress: pct(step1Done, step1Total), complete: pct(step1Done, step1Total) === 100 },
    { step: 2, title: 'Business & Compliance', progress: pct(step2Done, step2Fields.length), complete: pct(step2Done, step2Fields.length) === 100 },
    { step: 3, title: 'Product Catalog', progress: step3Progress, complete: step3Progress === 100 },
    { step: 4, title: 'Agreements', progress: step4Progress, complete: step4Progress === 100 },
    { step: 5, title: 'Review & Submit', progress: step5Progress, complete: step5Progress === 100 },
  ];

  var overall = Math.round(steps.reduce(function (sum, s) {
    return sum + s.progress;
  }, 0) / 5);

  return { steps: steps, overall: overall };
}

// ---------------------------------------------------------------------------
// Router (called from Code.gs doPost)
// ---------------------------------------------------------------------------

function handleWorkflowAction(action, data) {
  switch (action) {
    case 'register':
      return handleRegister(data);
    case 'login':
      return handleLogin(data);
    case 'logout':
      return handleLogout(data);
    case 'getSession':
      return handleGetSession(data);
    case 'adminLogin':
      return handleAdminLogin(data);
    case 'getDashboard':
      return handleGetDashboard(data);
    case 'saveWorkflowStep':
      return handleSaveWorkflowStep(data);
    case 'saveAgreements':
      return handleSaveAgreements(data);
    case 'skipCatalogStep':
      return handleSkipCatalogStep(data);
    case 'skipStoreAssetsStep':
      return handleSkipStoreAssetsStep(data);
    case 'confirmDataReview':
      return handleConfirmDataReview(data);
    case 'submitWorkflow':
      return handleSubmitWorkflow(data);
    case 'adminListMerchants':
      return handleAdminListMerchants(data);
    case 'adminGetMerchant':
      return handleAdminGetMerchant(data);
    case 'adminReviewMerchant':
      return handleAdminReviewMerchant(data);
    case 'adminUpdateMerchant':
      return handleAdminUpdateMerchant(data);
    default:
      return null;
  }
}
