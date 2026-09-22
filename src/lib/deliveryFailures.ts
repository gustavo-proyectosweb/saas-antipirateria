// src/lib/deliveryFailures.ts
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno para Supabase Admin')
  }

  return createClient(url, key)
}

interface LogFailureParams {
  purchaseId?: string | null
  buyerEmail: string
  productId?: string | null
  reason: 'MISSING_MASTER_FILE' | 'EMAIL_SEND_FAILED' | 'TOKEN_GENERATION_FAILED' | 'UNKNOWN'
  errorDetails?: string
}

/**
 * Registra un fallo de entrega en Supabase para revisión manual.
 */
export async function logDeliveryFailure(params: LogFailureParams) {
  try {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase.from('delivery_failures').insert({
      purchase_id: params.purchaseId || null,
      buyer_email: params.buyerEmail,
      product_id: params.productId || null,
      reason: params.reason,
      status: 'failed',
      error_details: params.errorDetails || 'Sin detalles',
    })

    if (error) {
      console.error('❌ Error guardando registro en delivery_failures:', error)
    } else {
      console.log(`⚠️ Fallo de entrega registrado en BD para: ${params.buyerEmail}`)
    }
  } catch (err) {
    console.error('❌ Excepción al registrar fallo de entrega:', err)
  }
}