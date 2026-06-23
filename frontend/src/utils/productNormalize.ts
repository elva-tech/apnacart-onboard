const UNIT_MAP: Record<string, string> = {
  ml: 'ml',
  milliliter: 'ml',
  millilitre: 'ml',
  l: 'l',
  ltr: 'l',
  liter: 'l',
  litre: 'l',
  kg: 'kg',
  kilogram: 'kg',
  g: 'g',
  gm: 'g',
  gram: 'g',
  grams: 'g',
  mg: 'mg',
}

/**
 * Normalizes product names and filenames for image matching.
 * "Milk 500ML" and "milk_500ml.jpg" both become "milk500ml"
 */
export function normalizeForMatching(input: string): string {
  let text = input.toLowerCase().trim()

  // Strip file extension
  text = text.replace(/\.(jpg|jpeg|png|webp)$/i, '')

  // Replace separators with nothing
  text = text.replace(/[_\-\s]+/g, '')

  // Normalize units attached to numbers: 500ml, 1kg, 200gm
  text = text.replace(/(\d+(?:\.\d+)?)\s*(ml|milliliter|millilitre|l|ltr|liter|litre|kg|kilogram|g|gm|gram|grams|mg)\b/gi, (_, num, unit) => {
    const key = unit.toLowerCase()
    const normalizedUnit = UNIT_MAP[key] || key
    return String(parseFloat(num)) + normalizedUnit
  })

  // Remove remaining special characters
  text = text.replace(/[^a-z0-9]/g, '')

  return text
}

export function tokenizeForMatching(input: string): string[] {
  const normalized = normalizeForMatching(input)
  const tokens: string[] = []
  const parts = normalized.match(/[a-z]+|\d+(?:\.\d+)?(?:ml|l|kg|g|mg)?/g)
  if (parts) tokens.push(...parts)
  return tokens
}
