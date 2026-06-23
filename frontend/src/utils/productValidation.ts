import type { Product } from '../types/catalog'
import { normalizeForMatching } from './productNormalize'

export interface ProductValidationIssue {
  row: number
  productName: string
  field: string
  message: string
}

export function validateProductRow(
  row: Partial<Product>,
  rowIndex: number,
  allNames: string[],
): ProductValidationIssue[] {
  const issues: ProductValidationIssue[] = []
  const name = row.productName?.trim() || ''

  if (!name) {
    issues.push({ row: rowIndex, productName: name, field: 'Product Name', message: 'Product name is required' })
  }

  if (!row.category?.trim()) {
    issues.push({ row: rowIndex, productName: name, field: 'Category', message: 'Category is required' })
  }

  if (!row.description?.trim()) {
    issues.push({ row: rowIndex, productName: name, field: 'Description', message: 'Description is required' })
  }

  if (!row.unit?.trim()) {
    issues.push({ row: rowIndex, productName: name, field: 'Unit', message: 'Unit is required' })
  }

  const sellingPrice = Number(row.sellingPrice)
  const mrp = Number(row.mrp)
  const stock = Number(row.stockQuantity)

  if (isNaN(sellingPrice) || sellingPrice < 0) {
    issues.push({ row: rowIndex, productName: name, field: 'Selling Price', message: 'Selling price must be a non-negative number' })
  }

  if (isNaN(mrp) || mrp < 0) {
    issues.push({ row: rowIndex, productName: name, field: 'MRP', message: 'MRP must be a non-negative number' })
  }

  if (!isNaN(sellingPrice) && !isNaN(mrp) && mrp < sellingPrice) {
    issues.push({ row: rowIndex, productName: name, field: 'MRP', message: 'MRP must be greater than or equal to selling price' })
  }

  if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    issues.push({ row: rowIndex, productName: name, field: 'Stock Quantity', message: 'Stock quantity must be a non-negative whole number' })
  }

  const normalized = normalizeForMatching(name)
  const duplicates = allNames.filter((n) => normalizeForMatching(n) === normalized && n.trim().toLowerCase() !== name.toLowerCase())
  if (name && duplicates.length > 0) {
    issues.push({ row: rowIndex, productName: name, field: 'Product Name', message: 'Duplicate product name' })
  }

  return issues
}

export function validateProducts(products: Product[]): ProductValidationIssue[] {
  const allIssues: ProductValidationIssue[] = []
  const names = products.map((p) => p.productName)

  products.forEach((product, index) => {
    const rowIssues = validateProductRow(product, index + 1, names.filter((_, i) => i !== index))
    allIssues.push(...rowIssues)
  })

  return allIssues
}

export function deriveRowStatus(product: Product): Product['rowStatus'] {
  if (product.validationErrors.length > 0) {
    if (product.validationErrors.some((e) => e.includes('Duplicate'))) return 'Duplicate Product'
    return 'Invalid Data'
  }
  if (!product.imagePreview && !product.imageUrl) return 'Missing Image'
  return 'Matched'
}

export function computeCatalogStats(products: Product[]): {
  totalProducts: number
  productsWithImages: number
  productsMissingImages: number
  duplicateProducts: number
  validationErrors: number
  completionPercentage: number
} {
  const totalProducts = products.length
  const productsWithImages = products.filter((p) => p.imagePreview || p.imageUrl).length
  const productsMissingImages = totalProducts - productsWithImages
  const duplicateProducts = products.filter((p) => p.rowStatus === 'Duplicate Product').length
  const validationErrors = products.reduce((sum, p) => sum + p.validationErrors.length, 0)

  let completionPercentage = 0
  if (totalProducts > 0) {
    const validProducts = products.filter((p) => p.validationErrors.length === 0).length
    const imageScore = (productsWithImages / totalProducts) * 50
    const dataScore = (validProducts / totalProducts) * 50
    completionPercentage = Math.round(imageScore + dataScore)
  }

  return {
    totalProducts,
    productsWithImages,
    productsMissingImages,
    duplicateProducts,
    validationErrors,
    completionPercentage,
  }
}
