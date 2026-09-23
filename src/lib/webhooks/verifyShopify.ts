// src/lib/webhooks/verifyShopify.ts
import crypto from 'crypto'

/**
 * Verifica si el webhook proviene legítimamente de Shopify
 * comparando la firma HMAC recibida con el texto original sin modificar (raw body)
 * utilizando el webhook_secret específico de la creadora.
 */
export function verifyShopifyHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string
): boolean {
  if (!hmacHeader || !secret) {
    return false
  }

  try {
    const generatedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64')

    const generatedBuffer = Buffer.from(generatedHmac, 'utf8')
    const headerBuffer = Buffer.from(hmacHeader, 'utf8')

    if (generatedBuffer.length !== headerBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(generatedBuffer, headerBuffer)
  } catch (error) {
    console.error('Error al verificar la firma HMAC de Shopify:', error)
    return false
  }
}