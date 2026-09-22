// src/lib/webhooks/processPurchase.ts
import { createClient } from '@supabase/supabase-js'
import { NormalizedOrderEvent } from './types'
import { createAccessToken } from '@/lib/tokens/generateToken'
import { sendDeliveryEmail } from '@/lib/emails/sendDeliveryEmail'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno requeridas para Supabase Admin')
  }

  return createClient(url, key)
}

export async function processPurchase(event: NormalizedOrderEvent) {
  const supabaseAdmin = getSupabaseAdmin()

  // 1. Buscar el producto interno mediante el ID externo
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name, creator_id')
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

  // 2. Verificar si la compra ya existe por external_order_id y platform
  const { data: existingPurchase } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('external_order_id', event.orderId)
    .eq('platform', event.platform)
    .single()

  let purchase = existingPurchase

  if (!purchase) {
    // Insertar la compra de forma IDEMPOTENTE
    const { data: newPurchase, error: purchaseError } = await supabaseAdmin
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

      console.error('❌ Detalle del error en Supabase:', JSON.stringify(purchaseError, null, 2))
      throw purchaseError
    }

    purchase = newPurchase
  }

  // Validación de seguridad para TypeScript (asegura que purchase no sea null/undefined)
  if (!purchase) {
    throw new Error('No se pudo obtener ni registrar la compra.')
  }

  if (!existingPurchase) {
    console.log('🎉 Compra guardada con éxito en la BD:', purchase.id)
  } else {
    console.log(`ℹ️ Reutilizando compra existente ID: ${purchase.id}`)
  }

  // 3. Generar o recuperar el token de acceso
  let activeToken: string

  const { data: existingToken } = await supabaseAdmin
    .from('access_tokens')
    .select('token')
    .eq('purchase_id', purchase.id)
    .single()

  if (existingToken) {
    activeToken = existingToken.token
    console.log(`🎟️ Reutilizando Access Token existente: ${activeToken}`)
  } else {
    const tokenResult = await createAccessToken(purchase.id, 30)
    activeToken = tokenResult.token
    console.log(`🎟️ Nuevo Access Token generado: ${activeToken}`)
  }

  // 4. Enviar email de entrega
  const emailResult = await sendDeliveryEmail({
    buyerEmail: event.customerEmail,
    productName: product.name || 'Tu Producto Digital',
    token: activeToken,
  })

  return {
    success: true,
    duplicated: !!existingPurchase,
    purchaseId: purchase.id,
    accessToken: activeToken,
    emailSent: emailResult.success,
  }
}