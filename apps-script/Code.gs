/**
 * ApnaCart Merchant Onboarding - Google Apps Script Backend
 *
 * Self-initializing: run setupOnboardingInfrastructure() once on a blank spreadsheet,
 * then deploy as Web App (Execute as: Me, Who has access: Anyone).
 */

const CONFIG = {
  SHEET_NAME: 'Merchant_Onboarding',
  ROOT_FOLDER_NAME: 'ApnaCart Merchant Onboarding',
  STATUS_SUBMITTED: 'SUBMITTED',
  REVIEW_STATUS_SUBMITTED: 'SUBMITTED',
  GO_LIVE_STATUS_PENDING: 'PENDING',
  SCRIPT_PROP_DRIVE_FOLDER_ID: 'APNACART_DRIVE_FOLDER_ID',
  HEADER_BACKGROUND: '#f3f4f6',
  MERCHANT_CODE_PREFIX: 'MER',
  STORE_CODE_PREFIX: 'STORE',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Handles GET requests (health check).
 */
function doGet(e) {
  return createJsonResponse({
    success: true,
    message: 'ApnaCart Merchant Onboarding API is running',
    apiVersion: 4,
    endpoints: [
      'POST submitOnboarding',
      'POST register',
      'POST login',
      'POST getDashboard',
      'POST saveWorkflowStep',
      'POST submitWorkflow',
      'POST skipCatalogStep',
      'POST skipStoreAssetsStep',
      'POST confirmDataReview',
      'POST adminListMerchants',
      'POST adminReviewMerchant',
    ],
    infrastructure: getInfrastructureStatus(),
    catalog: getCatalogInfrastructureStatus(),
  });
}

/**
 * Handles POST requests from the onboarding portal.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'submitOnboarding') {
      return handleSubmitOnboarding(payload.data);
    }

    var catalogResponse = handleCatalogAction(action, payload.data);
    if (catalogResponse) {
      return catalogResponse;
    }

    var workflowResponse = handleWorkflowAction(action, payload.data);
    if (workflowResponse) {
      return workflowResponse;
    }

    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (error) {
    Logger.log('doPost error: ' + error.message);
    return createJsonResponse({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

/**
 * Prepares the entire onboarding infrastructure (sheet + headers + Drive folder).
 * Safe to run multiple times — idempotent, never removes existing data.
 */
function setupOnboardingInfrastructure() {
  Logger.log('[DIAG] setupOnboardingInfrastructure — start');

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSpreadsheet) {
    Logger.log('[DIAG] Active spreadsheet name: ' + activeSpreadsheet.getName());
    Logger.log('[DIAG] Active spreadsheet ID: ' + activeSpreadsheet.getId());
  } else {
    Logger.log('[DIAG] Active spreadsheet: null (script may not be container-bound)');
  }

  Logger.log('Starting onboarding infrastructure setup...');

  const sheetResult = getOrCreateOnboardingSheet();
  Logger.log('[DIAG] Merchant_Onboarding found: ' + !sheetResult.created);
  Logger.log('[DIAG] Merchant_Onboarding created: ' + sheetResult.created);
  if (sheetResult.created) {
    Logger.log('Sheet created: ' + CONFIG.SHEET_NAME);
  } else {
    Logger.log('Sheet found: ' + CONFIG.SHEET_NAME);
  }

  const headersVerified = verifyAndEnsureHeaders(sheetResult.sheet);
  Logger.log('[DIAG] Headers verified result: ' + headersVerified);
  if (headersVerified) {
    Logger.log('Headers verified.');
  }

  const folderResult = getOrCreateDriveFolder();
  Logger.log('[DIAG] Drive folder ID: ' + folderResult.folder.getId());
  Logger.log('[DIAG] Drive folder created: ' + folderResult.created);
  if (folderResult.created) {
    Logger.log('Drive folder created: ' + CONFIG.ROOT_FOLDER_NAME);
  } else {
    Logger.log('Drive folder found: ' + CONFIG.ROOT_FOLDER_NAME);
  }

  Logger.log('Infrastructure setup completed.');
  Logger.log('Drive folder ID: ' + folderResult.folder.getId());
  Logger.log('[DIAG] setupOnboardingInfrastructure — end');

  return {
    sheetName: CONFIG.SHEET_NAME,
    sheetCreated: sheetResult.created,
    headersVerified: headersVerified,
    driveFolderId: folderResult.folder.getId(),
    driveFolderCreated: folderResult.created,
    totalHeaders: getSheetHeaders().length,
  };
}

/**
 * Verifies sheet, headers, and Drive folder. Useful after setup or before deployment.
 */
function testInfrastructure() {
  const status = getInfrastructureStatus();
  Logger.log(JSON.stringify(status, null, 2));
  return status;
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

function handleSubmitOnboarding(data) {
  validateSubmissionData(data);

  ensureInfrastructureExists();

  const sheet = getOrCreateOnboardingSheet().sheet;
  const onboardingId = generateOnboardingId(sheet);
  const merchantCode = generateMerchantCode(sheet);
  const storeCode = generateStoreCode(sheet);
  const rootFolder = getOrCreateDriveFolder().folder;
  const onboardingFolder = rootFolder.createFolder(onboardingId);

  const brandingFolder = getOrCreateSubfolder(onboardingFolder, 'Branding');
  const documentsFolder = getOrCreateSubfolder(onboardingFolder, 'Documents');
  const assetsFolder = getOrCreateSubfolder(onboardingFolder, 'StoreAssets');

  const fileUrls = {
    logoUrl: uploadFileToFolder(data.logo, brandingFolder, 'logo'),
    bannerUrl: uploadFileToFolder(data.banner, brandingFolder, 'banner'),
    gstCertificateUrl: uploadFileToFolder(data.gstCertificate, documentsFolder, 'gst'),
    panCardUrl: uploadFileToFolder(data.panCard, documentsFolder, 'pan'),
    fssaiLicenseUrl: uploadFileToFolder(data.fssaiLicense, documentsFolder, 'fssai'),
    businessRegistrationUrl: uploadFileToFolder(data.businessRegistration, documentsFolder, 'registration'),
    storeFrontPhotoUrl: uploadFileToFolder(data.storeFrontPhoto, assetsFolder, 'storefront'),
    storeInteriorPhotoUrl: uploadFileToFolder(data.storeInteriorPhoto, assetsFolder, 'interior'),
  };

  const completionPercentage = calculateCompletionPercentage(data);

  appendOnboardingRow(
    sheet,
    buildValuesByHeader(onboardingId, merchantCode, storeCode, data, fileUrls, completionPercentage)
  );

  Logger.log('Onboarding submitted: ' + onboardingId + ' / ' + merchantCode + ' / ' + storeCode);

  return createJsonResponse({
    success: true,
    onboardingId: onboardingId,
    merchantCode: merchantCode,
    storeCode: storeCode,
    completionPercentage: completionPercentage,
    apiVersion: 2,
  });
}

function ensureInfrastructureExists() {
  const status = getInfrastructureStatus();

  if (status.sheetExists && status.headersVerified && status.driveFolderExists) {
    Logger.log('Infrastructure verified — ready for submission.');
    return status;
  }

  Logger.log('Infrastructure incomplete — running automatic setup...');
  setupOnboardingInfrastructure();

  const refreshed = getInfrastructureStatus();
  if (!refreshed.sheetExists || !refreshed.headersVerified || !refreshed.driveFolderExists) {
    throw new Error('Failed to initialize onboarding infrastructure automatically.');
  }

  return refreshed;
}

function validateSubmissionData(data) {
  const requiredFields = [
    'storeName',
    'businessName',
    'ownerName',
    'primaryPhone',
    'emailAddress',
    'storeAddress',
    'city',
    'state',
    'pincode',
    'latitude',
    'longitude',
    'deliveryRadius',
    'minimumOrderAmount',
    'deliveryCharge',
    'adminName',
    'adminEmail',
    'adminPhone',
  ];

  requiredFields.forEach(function (field) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error('Missing required field: ' + field);
    }
  });

  if (!data.logo || !data.logo.base64) {
    throw new Error('Store logo is required');
  }

  if (!data.panCard || !data.panCard.base64) {
    throw new Error('PAN card is required');
  }

  if (!data.storeFrontPhoto || !data.storeFrontPhoto.base64) {
    throw new Error('Store front photo is required');
  }

  if (!data.storeInteriorPhoto || !data.storeInteriorPhoto.base64) {
    throw new Error('Store interior photo is required');
  }

  const phase2Required = [
    'whatsappNumber',
    'supportPhone',
    'supportEmail',
    'deliveryModel',
    'estimatedDeliveryTime',
    'accountHolderName',
    'bankName',
    'accountNumber',
    'ifscCode',
    'upiId',
  ];

  phase2Required.forEach(function (field) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error('Missing required field: ' + field);
    }
  });
}

function generateOnboardingId(sheet) {
  const timeZone = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), timeZone, 'yyyyMMdd');
  const prefix = 'APN-' + today + '-';

  const lastRow = sheet.getLastRow();
  var maxSequence = 0;

  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow, 1).getValues();
    ids.forEach(function (row) {
      const id = String(row[0] || '');
      if (id.indexOf(prefix) === 0) {
        const sequence = parseInt(id.split('-')[2], 10);
        if (!isNaN(sequence) && sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    });
  }

  const nextSequence = String(maxSequence + 1).padStart(4, '0');
  return prefix + nextSequence;
}

/**
 * Builds a header-keyed object for one onboarding submission row.
 */
function buildValuesByHeader(onboardingId, merchantCode, storeCode, data, fileUrls, completionPercentage) {
  const submittedAt = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );

  return {
    'Onboarding ID': onboardingId,
    Status: CONFIG.STATUS_SUBMITTED,
    'Review Status': CONFIG.REVIEW_STATUS_SUBMITTED,
    'Internal Notes': '',
    'Submitted At': submittedAt,
    'Store Name': data.storeName,
    'Business Name': data.businessName,
    'Owner Name': data.ownerName,
    'GST Number': data.gstNumber,
    'PAN Number': data.panNumber || '',
    'Primary Phone': data.primaryPhone,
    'Secondary Phone': data.secondaryPhone || '',
    'Email Address': data.emailAddress,
    'Store Address': data.storeAddress,
    Landmark: data.landmark || '',
    City: data.city,
    State: data.state,
    Pincode: data.pincode,
    Latitude: data.latitude,
    Longitude: data.longitude,
    'Delivery Radius': data.deliveryRadius,
    'Minimum Order Amount': data.minimumOrderAmount,
    'Delivery Charge': data.deliveryCharge,
    'Free Delivery Above':
      data.freeDeliveryAbove !== null && data.freeDeliveryAbove !== undefined
        ? data.freeDeliveryAbove
        : '',
    'COD Enabled': data.codEnabled ? 'TRUE' : 'FALSE',
    'Online Payment Enabled': data.onlinePaymentEnabled ? 'TRUE' : 'FALSE',
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
    'Store Description': data.storeDescription || '',
    'Brand Color': data.brandColor || '',
    'Logo URL': fileUrls.logoUrl || '',
    'Banner URL': fileUrls.bannerUrl || '',
    'Admin Name': data.adminName,
    'Admin Email': data.adminEmail,
    'Admin Phone': data.adminPhone,
    'Merchant Code': merchantCode,
    'Store Code': storeCode,
    'WhatsApp Number': data.whatsappNumber,
    'Support Phone': data.supportPhone,
    'Support Email': data.supportEmail,
    'GST Certificate URL': fileUrls.gstCertificateUrl || '',
    'PAN Card URL': fileUrls.panCardUrl || '',
    'FSSAI License URL': fileUrls.fssaiLicenseUrl || '',
    'Business Registration URL': fileUrls.businessRegistrationUrl || '',
    'Account Holder Name': data.accountHolderName,
    'Bank Name': data.bankName,
    'Account Number': data.accountNumber,
    'IFSC Code': data.ifscCode,
    'UPI ID': data.upiId,
    'Delivery Model': data.deliveryModel,
    'Estimated Delivery Time': data.estimatedDeliveryTime,
    'Store Front Photo URL': fileUrls.storeFrontPhotoUrl || '',
    'Store Interior Photo URL': fileUrls.storeInteriorPhotoUrl || '',
    'Go Live Status': CONFIG.GO_LIVE_STATUS_PENDING,
    'Go Live Date': '',
    'Completion Percentage': completionPercentage + '%',
  };
}

/**
 * Appends a row using the sheet's header row for column alignment.
 */
function appendOnboardingRow(sheet, valuesByHeader) {
  const existingHeaders = readExistingHeaders(sheet);

  if (existingHeaders.length === 0) {
    const requiredHeaders = getSheetHeaders();
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    applySheetFormatting(sheet, requiredHeaders.length);
    sheet.appendRow(
      requiredHeaders.map(function (header) {
        return valuesByHeader[header] !== undefined ? valuesByHeader[header] : '';
      })
    );
    return;
  }

  const row = existingHeaders.map(function (header) {
    return valuesByHeader[header] !== undefined ? valuesByHeader[header] : '';
  });

  sheet.appendRow(row);
}

function removeExistingFilesByBaseName(folder, baseName) {
  var prefix = String(baseName).toLowerCase() + '.';
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var name = file.getName().toLowerCase();
    if (name.indexOf(prefix) === 0) {
      file.setTrashed(true);
    }
  }
}

function uploadFileToFolder(fileData, folder, baseName) {
  if (!fileData || !fileData.base64) {
    return '';
  }

  const extension = getExtensionFromMimeType(fileData.type, fileData.name);
  const fileName = baseName + extension;
  removeExistingFilesByBaseName(folder, baseName);
  const bytes = Utilities.base64Decode(fileData.base64);
  const blob = Utilities.newBlob(bytes, fileData.type, fileName);
  const file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function getExtensionFromMimeType(mimeType, originalName) {
  const mimeMap = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };

  if (mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  if (originalName && originalName.indexOf('.') !== -1) {
    return originalName.substring(originalName.lastIndexOf('.'));
  }

  return '.png';
}

function getOrCreateSubfolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

function getColumnValuesByHeader(sheet, headerName) {
  const headers = readExistingHeaders(sheet);
  const colIndex = headers.indexOf(headerName);
  if (colIndex === -1) {
    return [];
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  const col = colIndex + 1;
  return sheet
    .getRange(2, col, lastRow, col)
    .getValues()
    .map(function (row) {
      return String(row[0] || '');
    });
}

function generateSequentialCode(sheet, headerName, prefix) {
  const values = getColumnValuesByHeader(sheet, headerName);
  var maxSequence = 0;

  values.forEach(function (value) {
    if (value.indexOf(prefix) === 0) {
      const sequence = parseInt(value.substring(prefix.length), 10);
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  });

  return prefix + String(maxSequence + 1).padStart(4, '0');
}

function generateMerchantCode(sheet) {
  return generateSequentialCode(sheet, 'Merchant Code', CONFIG.MERCHANT_CODE_PREFIX);
}

function generateStoreCode(sheet) {
  return generateSequentialCode(sheet, 'Store Code', CONFIG.STORE_CODE_PREFIX);
}

function calculateCompletionPercentage(data) {
  var completed = 0;
  const totalCategories = 6;

  const businessComplete =
    data.storeName &&
    data.businessName &&
    data.ownerName &&
    data.primaryPhone &&
    data.emailAddress;
  if (businessComplete) completed += 1;

  const locationComplete =
    data.storeAddress && data.city && data.state && data.pincode && data.latitude && data.longitude;
  if (locationComplete) completed += 1;

  const brandingComplete = data.logo && data.logo.base64 && data.brandColor;
  if (brandingComplete) completed += 1;

  const documentsComplete =
    data.panCard &&
    data.panCard.base64;
  if (documentsComplete) completed += 1;

  const bankComplete =
    data.accountHolderName &&
    data.bankName &&
    data.accountNumber &&
    data.ifscCode &&
    data.upiId;
  if (bankComplete) completed += 1;

  const adminComplete = data.adminName && data.adminEmail && data.adminPhone;
  if (adminComplete) completed += 1;

  return Math.round((completed / totalCategories) * 100);
}

/**
 * Backfills Phase 2 columns and codes for existing Phase 1 merchant rows.
 * Safe to run multiple times — only updates rows missing Merchant Code.
 */
function migrateExistingMerchants() {
  ensureInfrastructureExists();

  const sheet = getOrCreateOnboardingSheet().sheet;
  const headers = readExistingHeaders(sheet);
  const merchantCol = headers.indexOf('Merchant Code') + 1;
  const storeCol = headers.indexOf('Store Code') + 1;
  const reviewCol = headers.indexOf('Review Status') + 1;
  const goLiveCol = headers.indexOf('Go Live Status') + 1;
  const completionCol = headers.indexOf('Completion Percentage') + 1;
  const lastRow = sheet.getLastRow();

  if (merchantCol < 1 || lastRow < 2) {
    Logger.log('No merchant rows to migrate.');
    return { migrated: 0 };
  }

  var migrated = 0;

  for (var row = 2; row <= lastRow; row++) {
    const existingMerchantCode = String(sheet.getRange(row, merchantCol).getValue() || '').trim();
    if (existingMerchantCode) {
      continue;
    }

    const merchantCode = generateMerchantCode(sheet);
    const storeCode = generateStoreCode(sheet);

    sheet.getRange(row, merchantCol).setValue(merchantCode);
    if (storeCol > 0) {
      sheet.getRange(row, storeCol).setValue(storeCode);
    }
    if (reviewCol > 0) {
      const reviewStatus = String(sheet.getRange(row, reviewCol).getValue() || '').trim();
      if (!reviewStatus) {
        sheet.getRange(row, reviewCol).setValue(CONFIG.REVIEW_STATUS_SUBMITTED);
      }
    }
    if (goLiveCol > 0) {
      const goLiveStatus = String(sheet.getRange(row, goLiveCol).getValue() || '').trim();
      if (!goLiveStatus) {
        sheet.getRange(row, goLiveCol).setValue(CONFIG.GO_LIVE_STATUS_PENDING);
      }
    }
    if (completionCol > 0) {
      const completion = String(sheet.getRange(row, completionCol).getValue() || '').trim();
      if (!completion) {
        sheet.getRange(row, completionCol).setValue('67%');
      }
    }

    migrated += 1;
  }

  Logger.log('Migrated ' + migrated + ' existing merchant row(s).');
  return { migrated: migrated };
}

// ---------------------------------------------------------------------------
// Infrastructure helpers
// ---------------------------------------------------------------------------

/**
 * Returns the canonical header list for Merchant_Onboarding.
 */
function getSheetHeaders() {
  return [
    'Onboarding ID',
    'Status',
    'Review Status',
    'Internal Notes',
    'Submitted At',
    'Store Name',
    'Business Name',
    'Owner Name',
    'GST Number',
    'PAN Number',
    'Primary Phone',
    'Secondary Phone',
    'Email Address',
    'Store Address',
    'Landmark',
    'City',
    'State',
    'Pincode',
    'Latitude',
    'Longitude',
    'Delivery Radius',
    'Minimum Order Amount',
    'Delivery Charge',
    'Free Delivery Above',
    'COD Enabled',
    'Online Payment Enabled',
    'Monday Open',
    'Monday Close',
    'Tuesday Open',
    'Tuesday Close',
    'Wednesday Open',
    'Wednesday Close',
    'Thursday Open',
    'Thursday Close',
    'Friday Open',
    'Friday Close',
    'Saturday Open',
    'Saturday Close',
    'Sunday Open',
    'Sunday Close',
    'Store Description',
    'Brand Color',
    'Logo URL',
    'Banner URL',
    'Admin Name',
    'Admin Email',
    'Admin Phone',
    'Merchant Code',
    'Store Code',
    'WhatsApp Number',
    'Support Phone',
    'Support Email',
    'GST Certificate URL',
    'PAN Card URL',
    'FSSAI License URL',
    'Business Registration URL',
    'Account Holder Name',
    'Bank Name',
    'Account Number',
    'IFSC Code',
    'UPI ID',
    'Delivery Model',
    'Estimated Delivery Time',
    'Store Front Photo URL',
    'Store Interior Photo URL',
    'Go Live Status',
    'Go Live Date',
    'Completion Percentage',
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
}

/**
 * Locates or creates the Merchant_Onboarding sheet tab.
 * @returns {{ sheet: GoogleAppsScript.Spreadsheet.Sheet, created: boolean }}
 */
function getOrCreateOnboardingSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (spreadsheet) {
    Logger.log('[DIAG] getOrCreateOnboardingSheet — spreadsheet name: ' + spreadsheet.getName());
    Logger.log('[DIAG] getOrCreateOnboardingSheet — spreadsheet ID: ' + spreadsheet.getId());
    const sheetNames = spreadsheet.getSheets().map(function (s) {
      return s.getName();
    });
    Logger.log('[DIAG] getOrCreateOnboardingSheet — existing sheet names: ' + JSON.stringify(sheetNames));
  } else {
    Logger.log('[DIAG] getOrCreateOnboardingSheet — active spreadsheet is null');
  }

  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  var created = false;
  Logger.log('[DIAG] getOrCreateOnboardingSheet — Merchant_Onboarding found: ' + (sheet !== null));

  if (!sheet) {
    Logger.log('[DIAG] getOrCreateOnboardingSheet — creating sheet: ' + CONFIG.SHEET_NAME);
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    created = true;
  }

  Logger.log('[DIAG] getOrCreateOnboardingSheet — Merchant_Onboarding created: ' + created);

  return { sheet: sheet, created: created };
}

/**
 * Locates the root Drive folder without creating it.
 * @returns {GoogleAppsScript.Drive.Folder|null}
 */
function findDriveFolder() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty(CONFIG.SCRIPT_PROP_DRIVE_FOLDER_ID);

  if (storedId) {
    try {
      return DriveApp.getFolderById(storedId);
    } catch (error) {
      props.deleteProperty(CONFIG.SCRIPT_PROP_DRIVE_FOLDER_ID);
    }
  }

  const folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    const folder = folders.next();
    props.setProperty(CONFIG.SCRIPT_PROP_DRIVE_FOLDER_ID, folder.getId());
    return folder;
  }

  return null;
}

/**
 * Locates or creates the root Drive folder and persists its ID in Script Properties.
 * @returns {{ folder: GoogleAppsScript.Drive.Folder, created: boolean }}
 */
function getOrCreateDriveFolder() {
  Logger.log('[DIAG] getOrCreateDriveFolder — start');
  const existing = findDriveFolder();
  if (existing) {
    Logger.log('[DIAG] getOrCreateDriveFolder — Drive folder ID: ' + existing.getId());
    Logger.log('[DIAG] getOrCreateDriveFolder — Drive folder created: false');
    return { folder: existing, created: false };
  }

  const props = PropertiesService.getScriptProperties();
  const folder = DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
  props.setProperty(CONFIG.SCRIPT_PROP_DRIVE_FOLDER_ID, folder.getId());
  Logger.log('[DIAG] getOrCreateDriveFolder — Drive folder ID: ' + folder.getId());
  Logger.log('[DIAG] getOrCreateDriveFolder — Drive folder created: true');

  return { folder: folder, created: true };
}

/**
 * Reads existing header row from the sheet (trimmed, no trailing blanks).
 */
function readExistingHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1 || sheet.getLastRow() < 1) {
    return [];
  }

  const rowValues = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const headers = rowValues.map(function (value) {
    return String(value || '').trim();
  });

  while (headers.length > 0 && headers[headers.length - 1] === '') {
    headers.pop();
  }

  return headers;
}

/**
 * Ensures all required headers exist. Never deletes or reorders existing data columns.
 * @returns {boolean} true when headers are present and verified
 */
function verifyAndEnsureHeaders(sheet) {
  Logger.log('[DIAG] verifyAndEnsureHeaders — sheet name: ' + sheet.getName());
  const requiredHeaders = getSheetHeaders();
  const existingHeaders = readExistingHeaders(sheet);
  const lastRow = sheet.getLastRow();
  const hasDataRows = lastRow > 1;
  var headerCountWritten = 0;

  if (existingHeaders.length === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    applySheetFormatting(sheet, requiredHeaders.length);
    headerCountWritten = requiredHeaders.length;
    Logger.log('[DIAG] verifyAndEnsureHeaders — header count written: ' + headerCountWritten);
    Logger.log('Headers created.');
    return true;
  }

  if (existingHeaders[0] !== requiredHeaders[0] && !hasDataRows) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    applySheetFormatting(sheet, requiredHeaders.length);
    headerCountWritten = requiredHeaders.length;
    Logger.log('[DIAG] verifyAndEnsureHeaders — header count written: ' + headerCountWritten);
    Logger.log('Headers created (sheet had no data rows).');
    return true;
  }

  var nextCol = existingHeaders.length;
  var addedAny = false;

  requiredHeaders.forEach(function (header) {
    if (existingHeaders.indexOf(header) === -1) {
      nextCol += 1;
      sheet.getRange(1, nextCol).setValue(header);
      existingHeaders.push(header);
      addedAny = true;
      headerCountWritten += 1;
    }
  });

  if (addedAny) {
    Logger.log('[DIAG] verifyAndEnsureHeaders — header count written: ' + headerCountWritten);
    Logger.log('Missing headers appended without modifying existing columns.');
  } else {
    Logger.log('[DIAG] verifyAndEnsureHeaders — header count written: 0 (all headers already present)');
  }

  const finalColCount = Math.max(requiredHeaders.length, existingHeaders.length);
  applySheetFormatting(sheet, finalColCount);

  return headersMatchRequired(existingHeaders, requiredHeaders);
}

/**
 * Returns true when every required header exists in the sheet header row.
 */
function headersMatchRequired(existingHeaders, requiredHeaders) {
  return requiredHeaders.every(function (header) {
    return existingHeaders.indexOf(header) !== -1;
  });
}

/**
 * Applies header formatting: freeze, bold, background, filter, auto-resize.
 */
function applySheetFormatting(sheet, numCols) {
  if (numCols < 1) {
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground(CONFIG.HEADER_BACKGROUND);
  sheet.setFrozenRows(1);

  const existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }

  const filterRows = Math.max(sheet.getLastRow(), 1);
  sheet.getRange(1, 1, filterRows, numCols).createFilter();

  for (var col = 1; col <= numCols; col++) {
    sheet.autoResizeColumn(col);
  }
}

/**
 * Returns current infrastructure status (used by testInfrastructure and doGet).
 */
function getInfrastructureStatus() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  const sheetExists = sheet !== null;

  var headersVerified = false;
  var existingHeaderCount = 0;

  if (sheetExists) {
    const existingHeaders = readExistingHeaders(sheet);
    existingHeaderCount = existingHeaders.length;
    headersVerified = headersMatchRequired(existingHeaders, getSheetHeaders());
  }

  var driveFolderExists = false;
  var driveFolderId = '';

  const driveFolder = findDriveFolder();
  if (driveFolder) {
    driveFolderExists = true;
    driveFolderId = driveFolder.getId();
  }

  return {
    sheetExists: sheetExists,
    headersVerified: headersVerified,
    driveFolderExists: driveFolderExists,
    driveFolderId: driveFolderId,
    totalHeaders: getSheetHeaders().length,
    existingHeaderCount: existingHeaderCount,
  };
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Returns catalog infrastructure status for health checks.
 */
function getCatalogInfrastructureStatus() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var productsSheet = spreadsheet.getSheetByName('Merchant_Products');
  var categoriesSheet = spreadsheet.getSheetByName('Merchant_Categories');

  return {
    productsSheetExists: productsSheet !== null,
    categoriesSheetExists: categoriesSheet !== null,
    productHeaders: productsSheet ? readExistingHeaders(productsSheet).length : 0,
    categoryHeaders: categoriesSheet ? readExistingHeaders(categoriesSheet).length : 0,
  };
}
