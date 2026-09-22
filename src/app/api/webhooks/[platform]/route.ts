// src/app/api/webhooks/[platform]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SupportedPlatform } from '@/lib/webhooks/types'
import { normalizeWebhookPayload } from '@/lib/webhooks/mapper'
import { verifyShopifyHmac } from '@/lib/webhooks/verifyShopify'
import { verifyTiendanubeHmac } from '@/lib/webhooks/verifyTiendanube'
import { processPurchase } from '@/lib/webhooks/processPurchase'
import { logDeliveryFailure } from '@/lib/deliveryFailures'

// Instanciación bajo demanda para evitar errores de compilación en Vercel
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno requeridas para Supabase Admin')
  }

  return createClient(url, key)
}

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

    // 2. Obtener el cuerpo en texto crudo y parsear el payload
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody)

    // 3. Extraer el external_id del producto según la plataforma
    let externalProductId = ''
    if (platform === 'shopify') {
      externalProductId = String(payload.line_items?.[0]?.product_id || '')
    } else if (platform === 'tiendanube') {
      externalProductId = String(payload.products?.[0]?.product_id || '')
    }

    if (!externalProductId) {
      return NextResponse.json(
        { error: 'No se encontró un ID de producto en la solicitud' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 4. Buscar el producto para obtener a cuál creadora pertenece
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, creator_id, master_file_key')
      .eq('external_id', externalProductId)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: `Producto no registrado para external_id: ${externalProductId}` },
        { status: 404 }
      )
    }

    // 5. Consultar el secret de esa creadora específica en store_connections
    const { data: connection } = await supabaseAdmin
      .from('store_connections')
      .select('webhook_secret')
      .eq('creator_id', product.creator_id)
      .eq('platform', platform)
      .single()

    if (!connection || !connection.webhook_secret) {
      return NextResponse.json(
        { error: 'La creadora no tiene un webhook secret configurado para esta plataforma' },
        { status: 401 }
      )
    }

    const secret = connection.webhook_secret

    // 6. Verificación de firma HMAC utilizando el secret de la creadora
    if (platform === 'shopify') {
      const hmacHeader = request.headers.get('x-shopify-hmac-sha256')
      if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
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

      if (!verifyTiendanubeHmac(rawBody, hmacHeader, secret)) {
        return NextResponse.json(
          { error: 'No autorizado: Firma HMAC inválida' },
          { status: 401 }
        )
      }
    }

    // 7. Normalizar payload
    const normalizedEvent = normalizeWebhookPayload(platform, payload)

    // 8. EDGE CASE: Verificar si el producto tiene el archivo máster cargado
    if (!product.master_file_key) {
      console.warn(`⚠️ Producto ${product.id} no posee archivo máster asignado.`)

      const emailToLog = (normalizedEvent as any).buyerEmail || (normalizedEvent as any).email || (normalizedEvent as any).buyer_email || 'comprador_desconocido'

await logDeliveryFailure({
  buyerEmail: emailToLog,
  productId: product.id,
  reason: 'MISSING_MASTER_FILE',
  errorDetails: 'La compra fue registrada, pero el producto no tiene un archivo máster configurado en Cloudflare R2.',
})

      // Retornar 200 OK a la plataforma para no generar reintentos
      return NextResponse.json({
        received: true,
        processed: false,
        warning: 'El producto no tiene un archivo máster configurado.',
      }, { status: 200 })
    }

    // 9. Procesar compra con captura segura de excepciones
    try {
      const result = await processPurchase(normalizedEvent)

      return NextResponse.json({
        received: true,
        processed: result.success,
        duplicated: result.duplicated || false,
        data: normalizedEvent,
      })
    } catch (procError: any) {
      console.error('❌ Error procesando la entrega con processPurchase:', procError)

      const emailToLog = (normalizedEvent as any).buyerEmail || (normalizedEvent as any).email || (normalizedEvent as any).buyer_email || 'comprador_desconocido'

await logDeliveryFailure({
  buyerEmail: emailToLog,
  productId: product.id,
  reason: 'EMAIL_SEND_FAILED',
  errorDetails: procError.message || 'Error durante la generación de token o envío de correo.',
})

      // Retornar 200 OK indicando recepción exitosa pero registrando el fallo
      return NextResponse.json({
        received: true,
        processed: false,
        error_logged: true,
      }, { status: 200 })
    }

  } catch (error: any) {
    console.error('❌ Error no controlado en el webhook:', error)
    
    // Retornar 200 para prevenir bloqueos de webhook en la tienda externa
    return NextResponse.json(
      { received: true, error: 'Error interno mitigado', details: error.message },
      { status: 200 }
    )
  }
}