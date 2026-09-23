// src/lib/webhooks/mapper.ts
import { NormalizedOrderEvent, SupportedPlatform } from './types'

export function normalizeWebhookPayload(
  platform: SupportedPlatform,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): NormalizedOrderEvent {
  if (platform === 'shopify') {
    const lineItem = payload.line_items?.[0]
    const extractedEmail =
      payload.email || payload.buyer_email || payload.customer?.email || ''

    return {
      platform: 'shopify',
      orderId: String(payload.id || ''),
      externalProductId: String(lineItem?.product_id || lineItem?.variant_id || ''),
      customerEmail: String(extractedEmail).trim(),
      totalAmount: parseFloat(payload.current_total_price || payload.total_price || '0'),
      currency: payload.currency || 'USD',
    }
  }

  if (platform === 'tiendanube') {
    const productItem = payload.products?.[0]
    const extractedEmail =
      payload.customer?.email || payload.email || payload.buyer_email || ''

    return {
      platform: 'tiendanube',
      orderId: String(payload.id || ''),
      externalProductId: String(productItem?.product_id || productItem?.variant_id || ''),
      customerEmail: String(extractedEmail).trim(),
      totalAmount: parseFloat(payload.total || '0'),
      currency: payload.currency || 'ARS',
    }
  }

  throw new Error(`Plataforma no soportada: ${platform}`)
}