import type { AdminMerchantSummary } from '../types/workflow'

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '/api/onboarding'

async function adminRequest<T>(action: string, sessionToken: string, data: Record<string, unknown> = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, data: { sessionToken, ...data } }),
  })

  const text = await response.text()
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)

  const result = JSON.parse(text) as { success: boolean; error?: string } & T
  if (!result.success) throw new Error(result.error || 'Admin request failed')
  return result
}

export async function listMerchants(sessionToken: string) {
  const result = await adminRequest<{ merchants: AdminMerchantSummary[] }>(
    'adminListMerchants',
    sessionToken,
  )
  return result.merchants
}

export async function getMerchant(sessionToken: string, merchantCode: string) {
  return adminRequest<{
    merchant: Record<string, unknown>
    workflowStatus: string
    steps: { step: number; title: string; progress: number; complete: boolean }[]
    overallProgress: number
    productCount: number
    products: { productName?: string; sku?: string; sellingPrice?: number; imageUrl?: string; productStatus?: string }[]
    formData: Record<string, unknown>
  }>('adminGetMerchant', sessionToken, { merchantCode })
}

export async function updateMerchant(
  sessionToken: string,
  merchantCode: string,
  fields: Record<string, unknown>,
) {
  return adminRequest<{
    workflowStatus: string
    steps: { step: number; title: string; progress: number; complete: boolean }[]
    overallProgress: number
    formData: Record<string, unknown>
  }>('adminUpdateMerchant', sessionToken, { merchantCode, fields })
}

export async function reviewMerchant(
  sessionToken: string,
  merchantCode: string,
  action: 'REJECT' | 'APPROVE' | 'UNDER_REVIEW' | 'GO_LIVE',
  comments?: string,
) {
  return adminRequest<{ workflowStatus: string }>('adminReviewMerchant', sessionToken, {
    merchantCode,
    action,
    comments,
  })
}
