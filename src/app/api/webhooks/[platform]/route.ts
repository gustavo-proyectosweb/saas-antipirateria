// src/app/api/webhooks/[platform]/route.ts
import { NextResponse } from 'next/server'
import { SupportedPlatform } from '@/lib/webhooks/types'
import { normalizeWebhookPayload } from '@/lib/webhooks/mapper'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const resolvedParams = await params
    const platform = resolvedParams.platform as SupportedPlatform

    // Validar si es una plataforma soportada
    if (platform !== 'shopify' && platform !== 'tiendanube') {
      return NextResponse.json(
        { error: `Plataforma '${resolvedParams.platform}' no válida` },
        { status: 400 }
      )
    }

    // Leer el cuerpo JSON enviado por la plataforma
    const payload = await request.json()

    // Mapear/Normalizar los datos
    const normalizedEvent = normalizeWebhookPayload(platform, payload)

    // 🔍 Log temporal para verificación
    console.log('✅ Webhook recibido y normalizado con éxito:')
    console.dir(normalizedEvent, { depth: null })

    // Responder con 200 OK a la plataforma
    return NextResponse.json({
      received: true,
      data: normalizedEvent,
    })
  } catch (error) {
    console.error('❌ Error procesando el webhook:', error)
    return NextResponse.json(
      { error: 'Error al procesar el payload del webhook' },
      { status: 500 }
    )
  }
}