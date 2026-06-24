/**
 * ApnaCart Phase 3 — Product Catalog Backend
 * Paste into the same Apps Script project as Code.gs
 */

var CATALOG_CONFIG = {
  PRODUCTS_SHEET_NAME: 'Merchant_Products',
  CATEGORIES_SHEET_NAME: 'Merchant_Categories',
  CATALOG_ROOT_FOLDER: 'ApnaCart Product Catalog',
  PRODUCT_ID_PREFIX: 'PRD-',
  PRODUCT_STATUS_DRAFT: 'DRAFT',
  PRODUCT_STATUS_VALIDATED: 'VALIDATED',
  PRODUCT_STATUS_SUBMITTED: 'SUBMITTED',
  PRODUCT_STATUS_APPROVED: 'APPROVED',
  PRODUCT_STATUS_LIVE: 'LIVE',
  SCRIPT_PROP_CATALOG_FOLDER_ID: 'APNACART_CATALOG_FOLDER_ID',
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setupCatalogInfrastructure() {
  Logger.log('Starting catalog infrastructure setup...');

  var productsResult = getOrCreateProductsSheet();
  var categoriesResult = getOrCreateCategoriesSheet();
  var folderResult = getOrCreateCatalogDriveRoot();

  Logger.log('Catalog infrastructure setup completed.');

  return {
    productsSheet: CATALOG_CONFIG.PRODUCTS_SHEET_NAME,
    productsSheetCreated: productsResult.created,
    categoriesSheet: CATALOG_CONFIG.CATEGORIES_SHEET_NAME,
    categoriesSheetCreated: categoriesResult.created,
    catalogDriveFolderId: folderResult.folder.getId(),
    catalogDriveFolderCreated: folderResult.created,
    productHeaders: getProductSheetHeaders().length,
    categoryHeaders: getCategorySheetHeaders().length,
  };
}

function getProductSheetHeaders() {
  return [
    'Merchant Code',
    'Store Code',
    'Product ID',
    'Product Name',
    'Category',
    'Description',
    'SKU',
    'Brand',
    'Unit',
    'Weight',
    'MRP',
    'Selling Price',
    'Stock Quantity',
    'HSN Code',
    'Tax Percentage',
    'Image URL',
    'Product Status',
    'Created At',
    'Updated At',
  ];
}

function getCategorySheetHeaders() {
  return [
    'Merchant Code',
    'Category ID',
    'Name',
    'Parent Category ID',
    'Parent Path',
    'Level',
    'Created At',
    'Updated At',
  ];
}

function getOrCreateProductsSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CATALOG_CONFIG.PRODUCTS_SHEET_NAME);
  var created = false;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CATALOG_CONFIG.PRODUCTS_SHEET_NAME);
    created = true;
  }

  verifyAndEnsureSheetHeaders(sheet, getProductSheetHeaders());
  return { sheet: sheet, created: created };
}

function getOrCreateCategoriesSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CATALOG_CONFIG.CATEGORIES_SHEET_NAME);
  var created = false;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CATALOG_CONFIG.CATEGORIES_SHEET_NAME);
    created = true;
  }

  verifyAndEnsureSheetHeaders(sheet, getCategorySheetHeaders());
  return { sheet: sheet, created: created };
}

function verifyAndEnsureSheetHeaders(sheet, requiredHeaders) {
  var existingHeaders = readExistingHeaders(sheet);

  if (existingHeaders.length === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    applySheetFormatting(sheet, requiredHeaders.length);
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
    }
  });

  if (addedAny) {
    applySheetFormatting(sheet, Math.max(requiredHeaders.length, existingHeaders.length));
  }

  return requiredHeaders.every(function (header) {
    return existingHeaders.indexOf(header) !== -1;
  });
}

function getOrCreateCatalogDriveRoot() {
  var props = PropertiesService.getScriptProperties();
  var storedId = props.getProperty(CATALOG_CONFIG.SCRIPT_PROP_CATALOG_FOLDER_ID);

  if (storedId) {
    try {
      return { folder: DriveApp.getFolderById(storedId), created: false };
    } catch (e) {
      props.deleteProperty(CATALOG_CONFIG.SCRIPT_PROP_CATALOG_FOLDER_ID);
    }
  }

  var folders = DriveApp.getFoldersByName(CATALOG_CONFIG.CATALOG_ROOT_FOLDER);
  if (folders.hasNext()) {
    var existing = folders.next();
    props.setProperty(CATALOG_CONFIG.SCRIPT_PROP_CATALOG_FOLDER_ID, existing.getId());
    return { folder: existing, created: false };
  }

  var folder = DriveApp.createFolder(CATALOG_CONFIG.CATALOG_ROOT_FOLDER);
  props.setProperty(CATALOG_CONFIG.SCRIPT_PROP_CATALOG_FOLDER_ID, folder.getId());
  return { folder: folder, created: true };
}

function getOrCreateMerchantProductFolder(merchantCode) {
  var root = getOrCreateCatalogDriveRoot().folder;
  var folders = root.getFoldersByName(merchantCode);
  var merchantFolder;

  if (folders.hasNext()) {
    merchantFolder = folders.next();
  } else {
    merchantFolder = root.createFolder(merchantCode);
  }

  return getOrCreateSubfolder(merchantFolder, 'Products');
}

// ---------------------------------------------------------------------------
// Merchant access
// ---------------------------------------------------------------------------

function handleGetCatalogAccess(data) {
  if (!data.merchantCode) {
    throw new Error('merchantCode is required');
  }

  setupCatalogInfrastructure();
  var merchant = findMerchantByCode(data.merchantCode);

  if (!merchant) {
    throw new Error('Merchant not found: ' + data.merchantCode);
  }

  return createJsonResponse({
    success: true,
    merchant: {
      merchantCode: merchant.merchantCode,
      storeCode: merchant.storeCode,
      onboardingId: merchant.onboardingId,
      storeName: merchant.storeName,
      reviewStatus: merchant.reviewStatus,
    },
  });
}

function findMerchantByCode(merchantCode) {
  var sheet = getOrCreateOnboardingSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return null;

  var merchantCodeCol = headers.indexOf('Merchant Code') + 1;
  if (merchantCodeCol < 1) return null;

  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][merchantCodeCol - 1] || '').trim() === merchantCode) {
      return rowToMerchantObject(headers, values[i]);
    }
  }

  return null;
}

function rowToMerchantObject(headers, row) {
  function val(header) {
    var idx = headers.indexOf(header);
    return idx === -1 ? '' : row[idx];
  }

  return {
    merchantCode: String(val('Merchant Code') || '').trim(),
    storeCode: String(val('Store Code') || '').trim(),
    onboardingId: String(val('Onboarding ID') || '').trim(),
    storeName: String(val('Store Name') || '').trim(),
    ownerName: String(val('Owner Name') || '').trim(),
    primaryPhone: String(val('Primary Phone') || '').trim(),
    submittedAt: String(val('Submitted At') || '').trim(),
    reviewStatus: String(val('Review Status') || val('Status') || '').trim(),
    workflowStatus: String(val('Workflow Status') || '').trim(),
    currentWorkflowStep: val('Current Workflow Step'),
    adminComments: String(val('Admin Comments') || '').trim(),
    agreementsAccepted: String(val('Agreements Accepted') || '').trim(),
    agreementVersion: String(val('Agreement Version') || '').trim(),
    agreementAcceptedAt: String(val('Agreement Accepted At') || '').trim(),
    step1Progress: String(val('Step 1 Progress') || '').trim(),
    step2Progress: String(val('Step 2 Progress') || '').trim(),
    step3Progress: String(val('Step 3 Progress') || '').trim(),
    step4Progress: String(val('Step 4 Progress') || '').trim(),
    step5Progress: String(val('Step 5 Progress') || '').trim(),
    catalogSkipped: String(val('Catalog Skipped') || '').trim(),
    catalogSkippedAt: String(val('Catalog Skipped At') || '').trim(),
    storeAssetsSkipped: String(val('Store Assets Skipped') || '').trim(),
    storeAssetsSkippedAt: String(val('Store Assets Skipped At') || '').trim(),
    merchantAgreementUrl: String(val('Merchant Agreement URL') || '').trim(),
    reviewConfirmed: String(val('Review Confirmed') || '').trim(),
    reviewConfirmedAt: String(val('Review Confirmed At') || '').trim(),
    row: row,
    headers: headers,
  };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

function handleGetProducts(data) {
  if (!data.merchantCode) throw new Error('merchantCode is required');

  setupCatalogInfrastructure();
  var sheet = getOrCreateProductsSheet().sheet;
  var products = getProductsForMerchant(sheet, data.merchantCode);

  return createJsonResponse({ success: true, products: products });
}

function getProductsForMerchant(sheet, merchantCode) {
  var headers = readExistingHeaders(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var merchantCol = headers.indexOf('Merchant Code');
  if (merchantCol === -1) return [];

  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  var products = [];

  values.forEach(function (row) {
    if (String(row[merchantCol] || '').trim() !== merchantCode) return;
    products.push(rowToProductObject(headers, row));
  });

  return products;
}

function rowToProductObject(headers, row) {
  function val(header) {
    var idx = headers.indexOf(header);
    return idx === -1 ? '' : row[idx];
  }

  var productId = String(val('Product ID') || '').trim();

  return {
    id: productId || Utilities.getUuid(),
    productId: productId || null,
    productName: String(val('Product Name') || ''),
    category: String(val('Category') || ''),
    description: String(val('Description') || ''),
    sku: String(val('SKU') || ''),
    brand: String(val('Brand') || ''),
    unit: String(val('Unit') || ''),
    weight: String(val('Weight') || ''),
    mrp: Number(val('MRP')) || 0,
    sellingPrice: Number(val('Selling Price')) || 0,
    stockQuantity: Number(val('Stock Quantity')) || 0,
    hsnCode: String(val('HSN Code') || ''),
    taxPercentage: val('Tax Percentage') !== '' ? Number(val('Tax Percentage')) : null,
    imageUrl: String(val('Image URL') || ''),
    imagePreview: String(val('Image URL') || ''),
    imageFileName: '',
    productStatus: String(val('Product Status') || CATALOG_CONFIG.PRODUCT_STATUS_DRAFT),
    rowStatus: String(val('Image URL') || '') ? 'Matched' : 'Missing Image',
    validationErrors: [],
    selected: false,
  };
}

function handleSaveProducts(data) {
  if (!data.merchantCode) throw new Error('merchantCode is required');
  if (!data.products || !data.products.length) throw new Error('No products to save');

  setupCatalogInfrastructure();
  var merchant = findMerchantByCode(data.merchantCode);
  if (!merchant) throw new Error('Merchant not found');

  var sheet = getOrCreateProductsSheet().sheet;
  var productsFolder = getOrCreateMerchantProductFolder(data.merchantCode);
  var headers = readExistingHeaders(sheet);
  var savedProducts = [];
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");

  data.products.forEach(function (product) {
    var productId = product.productId || generateProductId(sheet);
    var imageUrl = '';

    if (product.image && product.image.base64) {
      var ext = getExtensionFromMimeType(product.image.type, product.image.name);
      var safeName = sanitizeFileName(product.productName) + ext;
      imageUrl = uploadFileToFolder(product.image, productsFolder, safeName.replace(ext, ''));
    }

    var valuesByHeader = {
      'Merchant Code': data.merchantCode,
      'Store Code': data.storeCode || merchant.storeCode,
      'Product ID': productId,
      'Product Name': product.productName,
      Category: product.category,
      Description: product.description || '',
      SKU: product.sku || '',
      Brand: product.brand || '',
      Unit: product.unit,
      Weight: product.weight || '',
      MRP: product.mrp,
      'Selling Price': product.sellingPrice,
      'Stock Quantity': product.stockQuantity,
      'HSN Code': product.hsnCode || '',
      'Tax Percentage': product.taxPercentage !== null && product.taxPercentage !== undefined ? product.taxPercentage : '',
      'Image URL': imageUrl,
      'Product Status': product.productStatus || CATALOG_CONFIG.PRODUCT_STATUS_DRAFT,
      'Created At': now,
      'Updated At': now,
    };

    upsertProductRow(sheet, headers, productId, data.merchantCode, valuesByHeader);
    savedProducts.push(rowToProductObject(headers, headers.map(function (h) {
      return valuesByHeader[h] !== undefined ? valuesByHeader[h] : '';
    })));
  });

  return createJsonResponse({
    success: true,
    saved: savedProducts.length,
    products: getProductsForMerchant(sheet, data.merchantCode),
  });
}

function upsertProductRow(sheet, headers, productId, merchantCode, valuesByHeader) {
  var lastRow = sheet.getLastRow();
  var productIdCol = headers.indexOf('Product ID');
  var merchantCol = headers.indexOf('Merchant Code');
  var rowIndex = -1;

  if (lastRow >= 2 && productIdCol !== -1) {
    var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
    for (var i = 0; i < values.length; i++) {
      if (
        String(values[i][productIdCol] || '').trim() === productId &&
        String(values[i][merchantCol] || '').trim() === merchantCode
      ) {
        rowIndex = i + 2;
        break;
      }
    }
  }

  var row = headers.map(function (header) {
    return valuesByHeader[header] !== undefined ? valuesByHeader[header] : '';
  });

  if (rowIndex > 0) {
    var createdAtCol = headers.indexOf('Created At');
    if (createdAtCol !== -1) {
      row[createdAtCol] = sheet.getRange(rowIndex, createdAtCol + 1).getValue();
    }
    var updatedAtCol = headers.indexOf('Updated At');
    if (updatedAtCol !== -1) {
      row[updatedAtCol] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
    }
    sheet.getRange(rowIndex, 1, rowIndex, headers.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function generateProductId(sheet) {
  var headers = readExistingHeaders(sheet);
  var productIdCol = headers.indexOf('Product ID') + 1;
  var lastRow = sheet.getLastRow();
  var maxSequence = 0;
  var prefix = CATALOG_CONFIG.PRODUCT_ID_PREFIX;

  if (lastRow >= 2 && productIdCol > 0) {
    var ids = sheet.getRange(2, productIdCol, lastRow, productIdCol).getValues();
    ids.forEach(function (row) {
      var id = String(row[0] || '');
      if (id.indexOf(prefix) === 0) {
        var sequence = parseInt(id.replace(prefix, ''), 10);
        if (!isNaN(sequence) && sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    });
  }

  return prefix + String(maxSequence + 1).padStart(6, '0');
}

function handleDeleteProducts(data) {
  if (!data.merchantCode) throw new Error('merchantCode is required');
  if (!data.productIds || !data.productIds.length) throw new Error('productIds required');

  var sheet = getOrCreateProductsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var productIdCol = headers.indexOf('Product ID');
  var merchantCol = headers.indexOf('Merchant Code');
  var lastRow = sheet.getLastRow();
  var deleted = 0;

  if (lastRow < 2) {
    return createJsonResponse({ success: true, deleted: 0 });
  }

  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  var rowsToDelete = [];

  for (var i = values.length - 1; i >= 0; i--) {
    var productId = String(values[i][productIdCol] || '').trim();
    var merchantCode = String(values[i][merchantCol] || '').trim();
    if (merchantCode === data.merchantCode && data.productIds.indexOf(productId) !== -1) {
      rowsToDelete.push(i + 2);
      deleted++;
    }
  }

  rowsToDelete.forEach(function (rowNum) {
    sheet.deleteRow(rowNum);
  });

  return createJsonResponse({ success: true, deleted: deleted });
}

function handleBulkUpdateProducts(data) {
  if (!data.merchantCode) throw new Error('merchantCode is required');
  if (!data.productIds || !data.productIds.length) throw new Error('productIds required');

  var sheet = getOrCreateProductsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var lastRow = sheet.getLastRow();
  var updated = 0;
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");

  if (lastRow < 2) {
    return createJsonResponse({ success: true, updated: 0 });
  }

  var productIdCol = headers.indexOf('Product ID');
  var merchantCol = headers.indexOf('Merchant Code');
  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();

  values.forEach(function (row, i) {
    var productId = String(row[productIdCol] || '').trim();
    var merchantCode = String(row[merchantCol] || '').trim();

    if (merchantCode !== data.merchantCode || data.productIds.indexOf(productId) === -1) return;

    if (data.updates.category !== undefined) {
      row[headers.indexOf('Category')] = data.updates.category;
    }
    if (data.updates.sellingPrice !== undefined) {
      row[headers.indexOf('Selling Price')] = data.updates.sellingPrice;
    }
    if (data.updates.stockQuantity !== undefined) {
      row[headers.indexOf('Stock Quantity')] = data.updates.stockQuantity;
    }
    if (data.updates.mrp !== undefined) {
      row[headers.indexOf('MRP')] = data.updates.mrp;
    }

    row[headers.indexOf('Updated At')] = now;
    sheet.getRange(i + 2, 1, i + 2, headers.length).setValues([row]);
    updated++;
  });

  return createJsonResponse({ success: true, updated: updated });
}

function handleSubmitCatalog(data) {
  if (!data.merchantCode) throw new Error('merchantCode is required');

  var sheet = getOrCreateProductsSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var lastRow = sheet.getLastRow();
  var submitted = 0;
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  var merchantCol = headers.indexOf('Merchant Code');
  var statusCol = headers.indexOf('Product Status');
  var imageCol = headers.indexOf('Image URL');

  if (lastRow < 2) {
    throw new Error('No products to submit');
  }

  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();

  values.forEach(function (row, i) {
    if (String(row[merchantCol] || '').trim() !== data.merchantCode) return;

    var imageUrl = String(row[imageCol] || '').trim();
    if (!imageUrl) {
      throw new Error('All products must have images before catalog submission');
    }

    row[statusCol] = CATALOG_CONFIG.PRODUCT_STATUS_SUBMITTED;
    row[headers.indexOf('Updated At')] = now;
    sheet.getRange(i + 2, 1, i + 2, headers.length).setValues([row]);
    submitted++;
  });

  return createJsonResponse({
    success: true,
    submitted: submitted,
    catalogStatus: CATALOG_CONFIG.PRODUCT_STATUS_SUBMITTED,
  });
}

function handleGetCatalogStats(data) {
  if (!data.merchantCode) throw new Error('merchantCode is required');

  var products = getProductsForMerchant(getOrCreateProductsSheet().sheet, data.merchantCode);
  var totalProducts = products.length;
  var productsWithImages = 0;
  var duplicateNames = {};
  var validationErrors = 0;
  var catalogStatus = 'NONE';

  products.forEach(function (p) {
    if (p.imageUrl) productsWithImages++;
    var key = String(p.productName || '').toLowerCase().trim();
    duplicateNames[key] = (duplicateNames[key] || 0) + 1;
    if (p.productStatus === CATALOG_CONFIG.PRODUCT_STATUS_SUBMITTED) catalogStatus = CATALOG_CONFIG.PRODUCT_STATUS_SUBMITTED;
    if (p.productStatus === CATALOG_CONFIG.PRODUCT_STATUS_APPROVED) catalogStatus = CATALOG_CONFIG.PRODUCT_STATUS_APPROVED;
    if (p.productStatus === CATALOG_CONFIG.PRODUCT_STATUS_LIVE) catalogStatus = CATALOG_CONFIG.PRODUCT_STATUS_LIVE;
    if (!p.productName || !p.category || p.mrp < p.sellingPrice) validationErrors++;
  });

  var duplicateProducts = Object.values(duplicateNames).filter(function (c) {
    return c > 1;
  }).length;

  var completionPercentage = 0;
  if (totalProducts > 0) {
    completionPercentage = Math.round(
      (productsWithImages / totalProducts) * 50 + ((totalProducts - duplicateProducts) / totalProducts) * 50
    );
  }

  return createJsonResponse({
    success: true,
    stats: {
      totalProducts: totalProducts,
      productsWithImages: productsWithImages,
      productsMissingImages: totalProducts - productsWithImages,
      duplicateProducts: duplicateProducts,
      validationErrors: validationErrors,
      completionPercentage: completionPercentage,
      catalogStatus: catalogStatus,
    },
  });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function handleGetCategories(data) {
  if (!data.merchantCode) throw new Error('merchantCode is required');

  setupCatalogInfrastructure();
  var sheet = getOrCreateCategoriesSheet().sheet;
  var categories = getCategoriesForMerchant(sheet, data.merchantCode);

  return createJsonResponse({ success: true, categories: categories });
}

function getCategoriesForMerchant(sheet, merchantCode) {
  var headers = readExistingHeaders(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var merchantCol = headers.indexOf('Merchant Code');
  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  var categories = [];

  values.forEach(function (row) {
    if (String(row[merchantCol] || '').trim() !== merchantCode) return;
    categories.push(rowToCategoryObject(headers, row));
  });

  return categories;
}

function rowToCategoryObject(headers, row) {
  function val(header) {
    var idx = headers.indexOf(header);
    return idx === -1 ? '' : row[idx];
  }

  var categoryId = String(val('Category ID') || '').trim();

  return {
    id: categoryId || Utilities.getUuid(),
    categoryId: categoryId || null,
    name: String(val('Name') || ''),
    parentId: String(val('Parent Category ID') || '') || null,
    parentName: String(val('Parent Path') || ''),
    level: Number(val('Level')) || 1,
  };
}

function handleSaveCategories(data) {
  if (!data.merchantCode) throw new Error('merchantCode is required');
  if (!data.categories) throw new Error('categories required');

  setupCatalogInfrastructure();
  var sheet = getOrCreateCategoriesSheet().sheet;
  var headers = readExistingHeaders(sheet);
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");

  clearMerchantCategories(sheet, headers, data.merchantCode);

  data.categories.forEach(function (cat) {
    var categoryId = cat.categoryId || generateCategoryId(sheet);
    var row = headers.map(function (header) {
      var map = {
        'Merchant Code': data.merchantCode,
        'Category ID': categoryId,
        Name: cat.name,
        'Parent Category ID': cat.parentId || '',
        'Parent Path': cat.parentName || '',
        Level: cat.level || 1,
        'Created At': now,
        'Updated At': now,
      };
      return map[header] !== undefined ? map[header] : '';
    });
    sheet.appendRow(row);
  });

  return createJsonResponse({
    success: true,
    categories: getCategoriesForMerchant(sheet, data.merchantCode),
  });
}

function clearMerchantCategories(sheet, headers, merchantCode) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var merchantCol = headers.indexOf('Merchant Code');
  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  var rowsToDelete = [];

  for (var i = values.length - 1; i >= 0; i--) {
    if (String(values[i][merchantCol] || '').trim() === merchantCode) {
      rowsToDelete.push(i + 2);
    }
  }

  rowsToDelete.forEach(function (rowNum) {
    sheet.deleteRow(rowNum);
  });
}

function generateCategoryId(sheet) {
  var headers = readExistingHeaders(sheet);
  var idCol = headers.indexOf('Category ID') + 1;
  var lastRow = sheet.getLastRow();
  var maxSequence = 0;

  if (lastRow >= 2 && idCol > 0) {
    var ids = sheet.getRange(2, idCol, lastRow, idCol).getValues();
    ids.forEach(function (row) {
      var id = String(row[0] || '');
      if (id.indexOf('CAT') === 0) {
        var sequence = parseInt(id.replace('CAT', ''), 10);
        if (!isNaN(sequence) && sequence > maxSequence) maxSequence = sequence;
      }
    });
  }

  return 'CAT' + String(maxSequence + 1).padStart(4, '0');
}

function sanitizeFileName(name) {
  return String(name || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .substring(0, 40) || 'product';
}

// ---------------------------------------------------------------------------
// Catalog action router (called from Code.gs doPost)
// ---------------------------------------------------------------------------

function handleCatalogAction(action, data) {
  switch (action) {
    case 'getCatalogAccess':
      return handleGetCatalogAccess(data);
    case 'getProducts':
      return handleGetProducts(data);
    case 'saveProducts':
      return handleSaveProducts(data);
    case 'deleteProducts':
      return handleDeleteProducts(data);
    case 'bulkUpdateProducts':
      return handleBulkUpdateProducts(data);
    case 'getCategories':
      return handleGetCategories(data);
    case 'saveCategories':
      return handleSaveCategories(data);
    case 'submitCatalog':
      return handleSubmitCatalog(data);
    case 'getCatalogStats':
      return handleGetCatalogStats(data);
    default:
      return null;
  }
}
