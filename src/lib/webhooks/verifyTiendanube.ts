// src/lib/webhooks/verifyTiendanube.ts
import crypto from 'crypto'

/**
 * Verifica si el webhook proviene de Tiendanube comparando el header
 * x-linkedstore-hmac-sha256 con el hash hexadecimal calculado sobre el raw body.
 */
export function verifyTiendanubeHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.TIENDANUBE_CLIENT_SECRET

  if (!hmacHeader || !secret) {
    return false
  }

  try {
    // Tiendanube requiere codificación HEXADECIMAL (.digest('hex'))
    const generatedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex')

    const generatedBuffer = Buffer.from(generatedHmac)
    const headerBuffer = Buffer.from(hmacHeader)

    if (generatedBuffer.length !== headerBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(generatedBuffer, headerBuffer)
  } catch (error) {
    console.error('Error al verificar la firma HMAC de Tiendanube:', error)
    return false
  }
}