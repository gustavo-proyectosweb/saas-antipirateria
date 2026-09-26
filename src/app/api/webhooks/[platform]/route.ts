// src/app/download/[token]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const token = resolvedParams.platform

    if (!token) {
      return NextResponse.json(
        { error: 'Token de descarga no proporcionado' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Obtener la compra asociada al token de descarga
    const { data: purchase, error } = await supabaseAdmin
      .from('purchases')
      .select('id, buyer_email, is_blocked, product_id, products(master_file_key)')
      .eq('download_token', token)
      .single()

    if (error || !purchase) {
      return NextResponse.json(
        { error: 'El enlace de descarga es inválido o ha expirado.' },
        { status: 404 }
      )
    }

    // 2. VERIFICACIÓN DE LISTA NEGRA (PASO 4)
    if (purchase.is_blocked) {
      console.warn(`🛑 Intentó de descarga denegado para compra bloqueada ID: ${purchase.id}`)
      
      return NextResponse.json(
        {
          error: 'Acceso Denegado',
          message: 'Esta descarga ha sido restringida por el creador del contenido.',
        },
        { status: 403 }
      )
    }

    // 3. Flujo Normal: Si la compra no está bloqueada, procesas el PDF con la marca y sirves el archivo...
    // (Lógica existente de estampa forense y entrega del stream)

    return NextResponse.json({
      message: 'Token válido, procediendo con estampado y descarga...',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('❌ Error en el endpoint de descarga:', error)

    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la descarga', details: errorMessage },
      { status: 500 }
    )
  }
}