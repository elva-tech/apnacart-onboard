import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CATALOG_STORAGE_KEY } from '../constants/catalog'
import type { CatalogMerchant, CatalogState, Category, ImageFileEntry, Product } from '../types/catalog'
import { matchImagesToProducts } from '../utils/imageMatching'
import { computeCatalogStats, deriveRowStatus, validateProducts } from '../utils/productValidation'

interface CatalogContextValue {
  state: CatalogState
  setMerchant: (merchant: CatalogMerchant) => void
  setProducts: (products: Product[]) => void
  importProducts: (products: Product[]) => void
  setImageFiles: (files: ImageFileEntry[]) => void
  runImageMatching: () => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteSelectedProducts: () => void
  bulkUpdateSelected: (updates: Partial<Pick<Product, 'category' | 'sellingPrice' | 'stockQuantity' | 'mrp'>>) => void
  assignImageToSelected: (imageFileName: string) => void
  toggleProductSelection: (id: string) => void
  toggleAllSelection: (selected: boolean) => void
  setCategories: (categories: Category[]) => void
  revalidateProducts: () => void
  markCatalogSubmitted: () => void
  loadFromServer: (products: Product[], categories: Category[]) => void
  stats: ReturnType<typeof computeCatalogStats>
}

const defaultState: CatalogState = {
  merchant: null,
  products: [],
  categories: [],
  imageFiles: [],
  imageMatchReport: null,
  lastSavedAt: null,
  catalogSubmitted: false,
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

function loadCatalogState(): CatalogState {
  try {
    const stored = localStorage.getItem(CATALOG_STORAGE_KEY)
    if (stored) return { ...defaultState, ...JSON.parse(stored) }
  } catch {
    // ignore
  }
  return defaultState
}

function saveCatalogState(state: CatalogState) {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(state))
}

function revalidateAll(products: Product[]): Product[] {
  const issues = validateProducts(products)
  const issueMap = new Map<string, string[]>()
  issues.forEach((issue) => {
    const key = products[issue.row - 1]?.id
    if (!key) return
    if (!issueMap.has(key)) issueMap.set(key, [])
    issueMap.get(key)!.push(issue.message)
  })

  return products.map((p) => {
    const validationErrors = issueMap.get(p.id) || []
    const updated = { ...p, validationErrors }
    return { ...updated, rowStatus: deriveRowStatus(updated) }
  })
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>(loadCatalogState)

  useEffect(() => {
    saveCatalogState(state)
  }, [state])

  const stats = useMemo(() => computeCatalogStats(state.products), [state.products])

  const setMerchant = useCallback((merchant: CatalogMerchant) => {
    setState((prev) => ({ ...prev, merchant }))
  }, [])

  const setProducts = useCallback((products: Product[]) => {
    setState((prev) => ({ ...prev, products: revalidateAll(products) }))
  }, [])

  const importProducts = useCallback((products: Product[]) => {
    setState((prev) => ({
      ...prev,
      products: revalidateAll(products),
      catalogSubmitted: false,
    }))
  }, [])

  const setImageFiles = useCallback((files: ImageFileEntry[]) => {
    setState((prev) => ({ ...prev, imageFiles: files }))
  }, [])

  const runImageMatching = useCallback(() => {
    setState((prev) => {
      const { products, report } = matchImagesToProducts(prev.products, prev.imageFiles)
      return { ...prev, products: revalidateAll(products), imageMatchReport: report }
    })
  }, [])

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setState((prev) => {
      const products = prev.products.map((p) => (p.id === id ? { ...p, ...updates } : p))
      return { ...prev, products: revalidateAll(products), catalogSubmitted: false }
    })
  }, [])

  const deleteSelectedProducts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      products: revalidateAll(prev.products.filter((p) => !p.selected)),
      catalogSubmitted: false,
    }))
  }, [])

  const bulkUpdateSelected = useCallback(
    (updates: Partial<Pick<Product, 'category' | 'sellingPrice' | 'stockQuantity' | 'mrp'>>) => {
      setState((prev) => {
        const products = prev.products.map((p) => (p.selected ? { ...p, ...updates } : p))
        return { ...prev, products: revalidateAll(products), catalogSubmitted: false }
      })
    },
    [],
  )

  const assignImageToSelected = useCallback((imageFileName: string) => {
    setState((prev) => {
      const file = prev.imageFiles.find((f) => f.name === imageFileName)
      if (!file) return prev
      const products = prev.products.map((p) =>
        p.selected
          ? {
              ...p,
              imageFileName: file.name,
              imagePreview: file.previewUrl,
            }
          : p,
      )
      return { ...prev, products: revalidateAll(products) }
    })
  }, [])

  const toggleProductSelection = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)),
    }))
  }, [])

  const toggleAllSelection = useCallback((selected: boolean) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => ({ ...p, selected })),
    }))
  }, [])

  const setCategories = useCallback((categories: Category[]) => {
    setState((prev) => ({ ...prev, categories }))
  }, [])

  const revalidateProducts = useCallback(() => {
    setState((prev) => ({ ...prev, products: revalidateAll(prev.products) }))
  }, [])

  const markCatalogSubmitted = useCallback(() => {
    setState((prev) => ({ ...prev, catalogSubmitted: true, lastSavedAt: new Date().toISOString() }))
  }, [])

  const loadFromServer = useCallback((products: Product[], categories: Category[]) => {
    setState((prev) => ({
      ...prev,
      products: revalidateAll(products),
      categories,
    }))
  }, [])

  const value = useMemo(
    () => ({
      state,
      setMerchant,
      setProducts,
      importProducts,
      setImageFiles,
      runImageMatching,
      updateProduct,
      deleteSelectedProducts,
      bulkUpdateSelected,
      assignImageToSelected,
      toggleProductSelection,
      toggleAllSelection,
      setCategories,
      revalidateProducts,
      markCatalogSubmitted,
      loadFromServer,
      stats,
    }),
    [
      state,
      setMerchant,
      setProducts,
      importProducts,
      setImageFiles,
      runImageMatching,
      updateProduct,
      deleteSelectedProducts,
      bulkUpdateSelected,
      assignImageToSelected,
      toggleProductSelection,
      toggleAllSelection,
      setCategories,
      revalidateProducts,
      markCatalogSubmitted,
      loadFromServer,
      stats,
    ],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
