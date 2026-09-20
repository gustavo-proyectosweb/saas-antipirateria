// src/app/api/webhooks/[platform]/route.ts
import { NextResponse } from 'next/server'
import { SupportedPlatform } from '@/lib/webhooks/types'
import { normalizeWebhookPayload } from '@/lib/webhooks/mapper'
import { verifyShopifyHmac } from '@/lib/webhooks/verifyShopify'
import { verifyTiendanubeHmac } from '@/lib/webhooks/verifyTiendanube'
import { processPurchase } from '@/lib/webhooks/processPurchase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const resolvedParams = await params
    const platform = resolvedParams.platform as SupportedPlatform

    // 1. Validar plataforma
    if (platform !== 'shopify' && platform !== 'tiendanube') {
      return NextResponse.json(
        { error: `Plataforma '${resolvedParams.platform}' no válida` },
        { status: 400 }
      )
    }

    // 2. Obtener el cuerpo en texto crudo
    const rawBody = await request.text()

    // 3. Verificación de firma HMAC
    if (platform === 'shopify') {
      const hmacHeader = request.headers.get('x-shopify-hmac-sha256')
      if (!verifyShopifyHmac(rawBody, hmacHeader)) {
        return NextResponse.json(
          { error: 'No autorizado: Firma HMAC inválida' },
          { status: 401 }
        )
      }
    }

    if (platform === 'tiendanube') {
      const hmacHeader =
        request.headers.get('x-linkedstore-hmac-sha256') ||
        request.headers.get('http_x_linkedstore_hmac_sha256')

      if (!verifyTiendanubeHmac(rawBody, hmacHeader)) {
        return NextResponse.json(
          { error: 'No autorizado: Firma HMAC inválida' },
          { status: 401 }
        )
      }
    }

    // 4. Normalizar payload
    const payload = JSON.parse(rawBody)
    const normalizedEvent = normalizeWebhookPayload(platform, payload)

    // 5. Persistir la compra en la base de datos (Idempotente)
    const result = await processPurchase(normalizedEvent)

    return NextResponse.json({
      received: true,
      processed: result.success,
      duplicated: result.duplicated || false,
      data: normalizedEvent,
    })
  } catch (error) {
    console.error('❌ Error procesando el webhook:', error)
    return NextResponse.json(
      { error: 'Error interno al procesar el webhook' },
      { status: 500 }
    )
  }
}