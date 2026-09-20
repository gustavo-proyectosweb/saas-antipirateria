// src/lib/webhooks/types.ts

export type SupportedPlatform = 'shopify' | 'tiendanube'

/**
 * Evento de orden normalizado que utilizará nuestro sistema
 * independientemente de la plataforma de origen.
 */
export interface NormalizedOrderEvent {
  platform: SupportedPlatform
  orderId: string
  externalProductId: string
  customerEmail: string
  totalAmount: number
  currency: string
}