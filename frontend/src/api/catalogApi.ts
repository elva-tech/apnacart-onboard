import type {
  CatalogMerchant,
  CatalogStats,
  Category,
  Product,
  ProductStatus,
  SaveProductsPayload,
} from '../types/catalog'

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '/api/onboarding'

async function catalogRequest<T>(action: string, data: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, data }),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  let result: { success: boolean; error?: string } & T
  try {
    result = JSON.parse(text)
  } catch {
    throw new Error('Invalid response from catalog API.')
  }

  if (!result.success) {
    throw new Error(result.error || 'Catalog request failed.')
  }

  return result
}

export async function getCatalogAccess(merchantCode: string): Promise<CatalogMerchant> {
  const result = await catalogRequest<{ merchant: CatalogMerchant }>('getCatalogAccess', { merchantCode })
  return result.merchant
}

export async function getProducts(merchantCode: string): Promise<Product[]> {
  const result = await catalogRequest<{ products: Product[] }>('getProducts', { merchantCode })
  return result.products
}

export async function saveProducts(payload: SaveProductsPayload): Promise<{ saved: number; products: Product[] }> {
  const result = await catalogRequest<{ saved: number; products: Product[] }>('saveProducts', {
    ...payload,
  })
  return { saved: result.saved, products: result.products }
}

export async function deleteProducts(merchantCode: string, productIds: string[]): Promise<number> {
  const result = await catalogRequest<{ deleted: number }>('deleteProducts', { merchantCode, productIds })
  return result.deleted
}

export async function bulkUpdateProducts(
  merchantCode: string,
  productIds: string[],
  updates: Partial<Pick<Product, 'category' | 'sellingPrice' | 'stockQuantity' | 'mrp'>>,
): Promise<number> {
  const result = await catalogRequest<{ updated: number }>('bulkUpdateProducts', {
    merchantCode,
    productIds,
    updates,
  })
  return result.updated
}

export async function getCategories(merchantCode: string): Promise<Category[]> {
  const result = await catalogRequest<{ categories: Category[] }>('getCategories', { merchantCode })
  return result.categories
}

export async function saveCategories(merchantCode: string, categories: Category[]): Promise<Category[]> {
  const result = await catalogRequest<{ categories: Category[] }>('saveCategories', {
    merchantCode,
    categories,
  })
  return result.categories
}

export async function submitCatalog(merchantCode: string): Promise<{ submitted: number; catalogStatus: ProductStatus }> {
  const result = await catalogRequest<{ submitted: number; catalogStatus: ProductStatus }>('submitCatalog', {
    merchantCode,
  })
  return { submitted: result.submitted, catalogStatus: result.catalogStatus }
}

export async function getCatalogStats(merchantCode: string): Promise<CatalogStats> {
  const result = await catalogRequest<{ stats: CatalogStats }>('getCatalogStats', { merchantCode })
  return result.stats
}
