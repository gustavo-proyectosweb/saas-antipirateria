// src/lib/webhooks/processPurchase.ts
import { createClient } from '@supabase/supabase-js'
import { NormalizedOrderEvent } from './types'

// Usamos el cliente con la Service Role Key para tener acceso de servidor sin RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function processPurchase(event: NormalizedOrderEvent) {
  // 1. Buscar el producto interno mediante el ID externo que nos dio la tienda
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, creator_id')
    .eq('external_id', event.externalProductId)
    .single()

  if (productError || !product) {
    console.warn(
      `⚠️ Producto no encontrado para external_id: ${event.externalProductId}`
    )
    return {
      success: false,
      reason: 'PRODUCT_NOT_FOUND',
      message: `No existe un producto registrado con external_id ${event.externalProductId}`,
    }
  }

  // 2. Insertar la compra de forma IDEMPOTENTE
  // .ignore() equivale a ON CONFLICT DO NOTHING en Supabase
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from('purchases')
    .insert({
      product_id: product.id,
      creator_id: product.creator_id,
      buyer_email: event.customerEmail,
      external_order_id: event.orderId,
      platform: event.platform,
      amount: event.totalAmount,
      currency: event.currency,
      status: 'completed',
    })
    .select()
    .single()

  if (purchaseError) {
  // 23505 = conflicto de clave única en Postgres (compra duplicada)
  if (purchaseError.code === '23505') {
    console.log(
      `ℹ️ Webhook duplicado recibido (Order ID: ${event.orderId}). Ignorando sin error.`
    )
    return {
      success: true,
      duplicated: true,
      message: 'Compra ya procesada anteriormente',
    }
  }

  // 🔍 Imprimir el detalle completo del error de Supabase
  console.error('❌ Detalle del error en Supabase:', JSON.stringify(purchaseError, null, 2))
  throw purchaseError
}

  console.log('🎉 Compra guardada con éxito en la BD:', purchase.id)

  return {
    success: true,
    duplicated: false,
    purchaseId: purchase.id,
  }
}