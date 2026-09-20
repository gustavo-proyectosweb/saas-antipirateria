// src/lib/webhooks/verifyShopify.ts
import crypto from 'crypto'

/**
 * Verifica si el webhook proviene legítimamente de Shopify
 * comparando la firma HMAC recibida con el texto original sin modificar (raw body).
 */
export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET

  // Si no hay firma en el header o no configuramos el secreto en .env, rechazamos
  if (!hmacHeader || !secret) {
    return false
  }

  try {
    // Calculamos el hash HMAC-SHA256 codificado en Base64
    const generatedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64')

    // Comparamos los hashes de forma segura usando timingSafeEqual
    const generatedBuffer = Buffer.from(generatedHmac)
    const headerBuffer = Buffer.from(hmacHeader)

    if (generatedBuffer.length !== headerBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(generatedBuffer, headerBuffer)
  } catch (error) {
    console.error('Error al verificar la firma HMAC de Shopify:', error)
    return false
  }
}