import type { PRODUCT_ROW_STATUSES, PRODUCT_STATUSES } from '../constants/catalog'

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]
export type ProductRowStatus = (typeof PRODUCT_ROW_STATUSES)[number]

export interface CatalogMerchant {
  merchantCode: string
  storeCode: string
  onboardingId: string
  storeName: string
  reviewStatus: string
}

export interface Product {
  id: string
  productId: string | null
  productName: string
  category: string
  description: string
  sku: string
  brand: string
  unit: string
  weight: string
  mrp: number
  sellingPrice: number
  stockQuantity: number
  hsnCode: string
  taxPercentage: number | null
  imageUrl: string
  imagePreview: string
  imageFileName: string
  productStatus: ProductStatus
  rowStatus: ProductRowStatus
  validationErrors: string[]
  selected: boolean
}

export interface Category {
  id: string
  categoryId: string | null
  name: string
  parentId: string | null
  parentName: string
  level: number
}

export interface ImageFileEntry {
  name: string
  base64: string
  mimeType: string
  previewUrl: string
  normalized: string
}

export interface ImageMatchReport {
  matched: { productId: string; productName: string; fileName: string }[]
  missingImages: { productId: string; productName: string }[]
  duplicateImages: { fileName: string; productNames: string[] }[]
  unusedImages: string[]
  unsupportedFormats: string[]
}

export interface CatalogStats {
  totalProducts: number
  productsWithImages: number
  productsMissingImages: number
  duplicateProducts: number
  validationErrors: number
  completionPercentage: number
  catalogStatus: ProductStatus | 'NONE'
}

export interface CatalogState {
  merchant: CatalogMerchant | null
  products: Product[]
  categories: Category[]
  imageFiles: ImageFileEntry[]
  imageMatchReport: ImageMatchReport | null
  lastSavedAt: string | null
  catalogSubmitted: boolean
}

export interface SaveProductsPayload {
  merchantCode: string
  storeCode: string
  products: {
    productId?: string | null
    productName: string
    category: string
    description: string
    sku: string
    brand: string
    unit: string
    weight: string
    mrp: number
    sellingPrice: number
    stockQuantity: number
    hsnCode: string
    taxPercentage: number | null
    productStatus: ProductStatus
    image?: { name: string; type: string; base64: string } | null
  }[]
}
