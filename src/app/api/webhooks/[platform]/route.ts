// src/app/api/webhooks/[platform]/route.ts
import { NextResponse } from 'next/server'
import { SupportedPlatform } from '@/lib/webhooks/types'
import { normalizeWebhookPayload } from '@/lib/webhooks/mapper'
import { verifyShopifyHmac } from '@/lib/webhooks/verifyShopify'
import { verifyTiendanubeHmac } from '@/lib/webhooks/verifyTiendanube'

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

    // 2. Obtener el cuerpo en texto crudo (RAW Body)
    const rawBody = await request.text()

    // 3. Verificación de firma según la plataforma
    if (platform === 'shopify') {
      const hmacHeader = request.headers.get('x-shopify-hmac-sha256')
      if (!verifyShopifyHmac(rawBody, hmacHeader)) {
        console.warn('⚠️ Webhook Shopify rechazado: Firma HMAC inválida')
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
        console.warn('⚠️ Webhook Tiendanube rechazado: Firma HMAC inválida')
        return NextResponse.json(
          { error: 'No autorizado: Firma HMAC inválida' },
          { status: 401 }
        )
      }
    }

    // 4. Convertir texto a JSON para normalizar
    const payload = JSON.parse(rawBody)
    const normalizedEvent = normalizeWebhookPayload(platform, payload)

    console.log(`✅ Webhook de ${platform.toUpperCase()} autorizado y normalizado:`)
    console.dir(normalizedEvent, { depth: null })

    return NextResponse.json({
      received: true,
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