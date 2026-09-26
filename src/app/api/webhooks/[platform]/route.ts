import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno para Supabase Admin')
  }

  return createClient(url, key)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const resolvedParams = await params
    // 'platform' es el parámetro dinámico que recibe de la URL /api/webhooks/[platform]
    const platform = resolvedParams.platform

    if (!platform) {
      return NextResponse.json(
        { error: 'Plataforma o token no proporcionado' },
        { status: 400 }
      )
    }

    // Log de inicio estructurado
    console.log('[WEBHOOK_ENDPOINT_ACCESSED]', {
      timestamp: new Date().toISOString(),
      platform,
    })

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Obtener la compra asociada al token/identificador de plataforma
    const { data: purchase, error } = await supabaseAdmin
      .from('purchases')
      .select('id, buyer_email, is_blocked, product_id, products(master_file_key)')
      .eq('download_token', platform)
      .single()

    if (error || !purchase) {
      return NextResponse.json(
        { error: 'El enlace de descarga es inválido o ha expirado.' },
        { status: 404 }
      )
    }

    // 2. VERIFICACIÓN DE LISTA NEGRA (PASO 4)
    if (purchase.is_blocked) {
      console.warn(`🛑 Intento de descarga denegado para compra bloqueada ID: ${purchase.id}`)
      
      return NextResponse.json(
        {
          error: 'Acceso Denegado',
          message: 'Esta descarga ha sido restringida por el creador del contenido.',
        },
        { status: 403 }
      )
    }

    // 3. Flujo Normal: Procesamiento de estampa forense y entrega
    return NextResponse.json({
      message: 'Token válido, procediendo con estampado y descarga...',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    // Log estructurado en consola del servidor
    console.error('❌ Error en el endpoint de descarga/webhook:', {
      timestamp: new Date().toISOString(),
      error: errorMessage,
    })

    // Captura del error no manejado en Sentry
    Sentry.captureException(error, {
      extra: {
        endpoint: '/api/webhooks/[platform]',
      },
    })

    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la descarga', details: errorMessage },
      { status: 500 }
    )
  }
}