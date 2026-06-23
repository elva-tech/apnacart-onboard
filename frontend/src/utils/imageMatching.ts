import { IMAGE_EXTENSIONS } from '../constants/catalog'
import type { ImageFileEntry, ImageMatchReport, Product } from '../types/catalog'
import { normalizeForMatching, tokenizeForMatching } from './productNormalize'

function scoreMatch(productNorm: string, fileNorm: string, productTokens: string[], fileTokens: string[]): number {
  if (productNorm === fileNorm) return 100
  if (productNorm.includes(fileNorm) || fileNorm.includes(productNorm)) return 80

  const common = productTokens.filter((t) => fileTokens.includes(t))
  if (common.length === 0) return 0

  const ratio = common.length / Math.max(productTokens.length, fileTokens.length)
  return Math.round(ratio * 70)
}

export function matchImagesToProducts(
  products: Product[],
  imageFiles: ImageFileEntry[],
): { products: Product[]; report: ImageMatchReport } {
  const report: ImageMatchReport = {
    matched: [],
    missingImages: [],
    duplicateImages: [],
    unusedImages: [],
    unsupportedFormats: [],
  }

  const usedFiles = new Set<string>()
  const fileToProducts: Record<string, string[]> = {}

  const validFiles = imageFiles.filter((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number])) {
      report.unsupportedFormats.push(file.name)
      return false
    }
    return true
  })

  const updatedProducts = products.map((product) => {
    const productNorm = normalizeForMatching(product.productName)
    const productTokens = tokenizeForMatching(product.productName)

    let bestFile: ImageFileEntry | null = null
    let bestScore = 0

    for (const file of validFiles) {
      const fileNorm = file.normalized
      const fileTokens = tokenizeForMatching(file.name)
      const score = scoreMatch(productNorm, fileNorm, productTokens, fileTokens)
      if (score > bestScore && score >= 60) {
        bestScore = score
        bestFile = file
      }
    }

    if (bestFile) {
      usedFiles.add(bestFile.name)
      if (!fileToProducts[bestFile.name]) fileToProducts[bestFile.name] = []
      fileToProducts[bestFile.name].push(product.productName)

      report.matched.push({
        productId: product.id,
        productName: product.productName,
        fileName: bestFile.name,
      })

      return {
        ...product,
        imageFileName: bestFile.name,
        imagePreview: bestFile.previewUrl,
        rowStatus: product.validationErrors.length > 0 ? product.rowStatus : ('Matched' as const),
      }
    }

    if (!product.imageUrl && !product.imagePreview) {
      report.missingImages.push({ productId: product.id, productName: product.productName })
    }

    return {
      ...product,
      rowStatus: product.validationErrors.length > 0 ? product.rowStatus : ('Missing Image' as const),
    }
  })

  Object.entries(fileToProducts).forEach(([fileName, productNames]) => {
    if (productNames.length > 1) {
      report.duplicateImages.push({ fileName, productNames })
    }
  })

  validFiles.forEach((file) => {
    if (!usedFiles.has(file.name)) {
      report.unusedImages.push(file.name)
    }
  })

  return { products: updatedProducts, report }
}
