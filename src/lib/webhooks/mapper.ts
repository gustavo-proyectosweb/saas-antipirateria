// src/lib/webhooks/mapper.ts
import { NormalizedOrderEvent, SupportedPlatform } from './types'

export function normalizeWebhookPayload(
  platform: SupportedPlatform,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): NormalizedOrderEvent {
  if (platform === 'shopify') {
    // Estructura habitual del payload de una orden en Shopify
    const lineItem = payload.line_items?.[0]

    return {
      platform: 'shopify',
      orderId: String(payload.id || ''),
      externalProductId: String(lineItem?.product_id || lineItem?.variant_id || ''),
      customerEmail: payload.email || payload.customer?.email || '',
      totalAmount: parseFloat(payload.current_total_price || payload.total_price || '0'),
      currency: payload.currency || 'USD',
    }
  }

  if (platform === 'tiendanube') {
    // Estructura habitual del payload de una orden en Tiendanube
    const productItem = payload.products?.[0]

    return {
      platform: 'tiendanube',
      orderId: String(payload.id || ''),
      externalProductId: String(productItem?.product_id || productItem?.variant_id || ''),
      customerEmail: payload.customer?.email || '',
      totalAmount: parseFloat(payload.total || '0'),
      currency: payload.currency || 'ARS',
    }
  }

  throw new Error(`Plataforma no soportada: ${platform}`)
}