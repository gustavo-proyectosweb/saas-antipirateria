// src/app/api/webhooks/[platform]/route.ts
import { NextResponse } from 'next/server'
import { SupportedPlatform } from '@/lib/webhooks/types'
import { normalizeWebhookPayload } from '@/lib/webhooks/mapper'
import { verifyShopifyHmac } from '@/lib/webhooks/verifyShopify'

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

    // 3. Verificación de seguridad específica para Shopify
    if (platform === 'shopify') {
      const hmacHeader = request.headers.get('x-shopify-hmac-sha256')
      const isValid = verifyShopifyHmac(rawBody, hmacHeader)

      if (!isValid) {
        console.warn('⚠️ Intento de webhook rechazado: Firma HMAC de Shopify inválida')
        return NextResponse.json(
          { error: 'No autorizado: Firma HMAC inválida' },
          { status: 401 }
        )
      }
    }

    // 4. Convertir el texto a JSON para el mapper
    const payload = JSON.parse(rawBody)

    // 5. Mapear datos
    const normalizedEvent = normalizeWebhookPayload(platform, payload)

    console.log('✅ Webhook autorizado y normalizado:')
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