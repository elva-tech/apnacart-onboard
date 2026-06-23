export const CATALOG_STORAGE_KEY = 'apnacart_catalog_state'

export const MAX_PRODUCT_FILE_BYTES = 20 * 1024 * 1024
export const MAX_IMAGE_ZIP_BYTES = 50 * 1024 * 1024

export const PRODUCT_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-excel',
] as const

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

export const PRODUCT_TEMPLATE_COLUMNS = {
  required: [
    'Product Name',
    'Category',
    'Description',
    'Unit',
    'Selling Price',
    'MRP',
    'Stock Quantity',
  ],
  optional: ['SKU', 'HSN Code', 'Tax Percentage', 'Brand', 'Weight'],
} as const

export const COLUMN_ALIASES: Record<string, string> = {
  'product name': 'Product Name',
  productname: 'Product Name',
  name: 'Product Name',
  category: 'Category',
  description: 'Description',
  unit: 'Unit',
  'selling price': 'Selling Price',
  sellingprice: 'Selling Price',
  price: 'Selling Price',
  mrp: 'MRP',
  'stock quantity': 'Stock Quantity',
  stockquantity: 'Stock Quantity',
  stock: 'Stock Quantity',
  quantity: 'Stock Quantity',
  sku: 'SKU',
  'hsn code': 'HSN Code',
  hsncode: 'HSN Code',
  hsn: 'HSN Code',
  'tax percentage': 'Tax Percentage',
  taxpercentage: 'Tax Percentage',
  tax: 'Tax Percentage',
  brand: 'Brand',
  weight: 'Weight',
}

export const PRODUCT_STATUSES = [
  'DRAFT',
  'VALIDATED',
  'SUBMITTED',
  'APPROVED',
  'LIVE',
] as const

export const PRODUCT_ROW_STATUSES = [
  'Matched',
  'Missing Image',
  'Duplicate Product',
  'Invalid Data',
] as const

export const CATALOG_NAV = [
  { path: '/catalog', label: 'Dashboard' },
  { path: '/catalog/upload', label: 'Upload Products' },
  { path: '/catalog/images', label: 'Upload Images' },
  { path: '/catalog/review', label: 'Review Products' },
  { path: '/catalog/categories', label: 'Categories' },
  { path: '/catalog/reports', label: 'Reports' },
] as const
