import * as XLSX from 'xlsx'
import { COLUMN_ALIASES, PRODUCT_TEMPLATE_COLUMNS } from '../constants/catalog'
import type { Product } from '../types/catalog'
import { validateProductRow } from './productValidation'

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase().replace(/\s+/g, ' ')
  return COLUMN_ALIASES[key] || COLUMN_ALIASES[key.replace(/\s/g, '')] || header.trim()
}

function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return NaN
  const n = Number(String(value).replace(/,/g, '').trim())
  return n
}

function createProductId(): string {
  return `local-${crypto.randomUUID()}`
}

export function parseProductFile(buffer: ArrayBuffer, fileName: string): Product[] {
  const isCsv = fileName.toLowerCase().endsWith('.csv')
  const workbook = isCsv
    ? XLSX.read(new TextDecoder().decode(buffer), { type: 'string' })
    : XLSX.read(buffer, { type: 'array' })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('No worksheet found in the uploaded file.')

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (rows.length === 0) throw new Error('The uploaded file contains no product rows.')

  const rawHeaders = Object.keys(rows[0] || {})
  const headerMap: Record<string, string> = {}
  rawHeaders.forEach((h) => {
    headerMap[h] = normalizeHeader(h)
  })

  const mappedHeaders = Object.values(headerMap)
  const missingRequired = PRODUCT_TEMPLATE_COLUMNS.required.filter((col) => !mappedHeaders.includes(col))
  if (missingRequired.length > 0) {
    throw new Error(`Missing required columns: ${missingRequired.join(', ')}`)
  }

  const products: Product[] = rows
    .map((row): Product | null => {
      const mapped: Record<string, unknown> = {}
      Object.entries(row).forEach(([key, value]) => {
        mapped[headerMap[key] || key] = value
      })

      const productName = String(mapped['Product Name'] || '').trim()
      if (!productName) return null

      return {
        id: createProductId(),
        productId: null,
        productName,
        category: String(mapped['Category'] || '').trim(),
        description: String(mapped['Description'] || '').trim(),
        sku: String(mapped['SKU'] || '').trim(),
        brand: String(mapped['Brand'] || '').trim(),
        unit: String(mapped['Unit'] || '').trim(),
        weight: String(mapped['Weight'] || '').trim(),
        mrp: parseNumber(mapped['MRP']),
        sellingPrice: parseNumber(mapped['Selling Price']),
        stockQuantity: parseNumber(mapped['Stock Quantity']),
        hsnCode: String(mapped['HSN Code'] || '').trim(),
        taxPercentage: mapped['Tax Percentage'] !== '' ? parseNumber(mapped['Tax Percentage']) : null,
        imageUrl: '',
        imagePreview: '',
        imageFileName: '',
        productStatus: 'DRAFT' as const,
        rowStatus: 'Invalid Data' as const,
        validationErrors: [] as string[],
        selected: false,
      }
    })
    .filter((p): p is Product => p !== null)

  const names = products.map((p) => p.productName)
  return products.map((product, index) => {
    const issues = validateProductRow(product, index + 1, names.filter((_, i) => i !== index))
    const validationErrors = issues.map((i) => i.message)
    const isDuplicate = issues.some((i) => i.message.includes('Duplicate'))
    let rowStatus = product.rowStatus
    if (validationErrors.length > 0) {
      rowStatus = isDuplicate ? 'Duplicate Product' : 'Invalid Data'
    } else {
      rowStatus = 'Missing Image'
    }
    return { ...product, validationErrors, rowStatus }
  })
}

export function generateProductTemplate(): void {
  const headers = [...PRODUCT_TEMPLATE_COLUMNS.required, ...PRODUCT_TEMPLATE_COLUMNS.optional]
  const sample = [
    {
      'Product Name': 'Milk 500ML',
      Category: 'Dairy > Milk',
      Description: 'Fresh toned milk',
      Unit: 'Pack',
      'Selling Price': 28,
      MRP: 30,
      'Stock Quantity': 100,
      SKU: 'MILK-500',
      'HSN Code': '0401',
      'Tax Percentage': 5,
      Brand: 'Nandini',
      Weight: '500ml',
    },
    {
      'Product Name': 'Curd 1KG',
      Category: 'Dairy > Curd',
      Description: 'Fresh curd',
      Unit: 'Pack',
      'Selling Price': 65,
      MRP: 70,
      'Stock Quantity': 50,
      SKU: 'CURD-1KG',
      Brand: 'Nandini',
      Weight: '1kg',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(sample, { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  XLSX.writeFile(wb, 'Products_Template.xlsx')
}

export function exportProductsToExcel(products: Product[], fileName: string): void {
  const rows = products.map((p) => ({
    'Product Name': p.productName,
    Category: p.category,
    Description: p.description,
    Unit: p.unit,
    'Selling Price': p.sellingPrice,
    MRP: p.mrp,
    'Stock Quantity': p.stockQuantity,
    SKU: p.sku,
    'HSN Code': p.hsnCode,
    'Tax Percentage': p.taxPercentage ?? '',
    Brand: p.brand,
    Weight: p.weight,
    'Image File': p.imageFileName || '',
    Status: p.rowStatus,
    Errors: p.validationErrors.join('; '),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  XLSX.writeFile(wb, fileName)
}
