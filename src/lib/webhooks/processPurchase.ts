// src/lib/webhooks/processPurchase.ts
import { createClient } from '@supabase/supabase-js'
import { NormalizedOrderEvent } from './types'
import { createAccessToken } from '@/lib/tokens/generateToken'
import { sendDeliveryEmail } from '@/lib/emails/sendDeliveryEmail'
import { isEmailBlocked } from '@/app/dashboard/blocklist/actions'

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

  // VERIFICACIÓN DE LISTA NEGRA
  const isBlocked = await isEmailBlocked(event.customerEmail, product.creator_id)

  if (isBlocked) {
    console.warn(
      `⚠️ [ALERTA LISTA NEGRA] El comprador ${event.customerEmail} está en la lista negra de la creadora ${product.creator_id}.`
    )
  }

  // 2. Verificar si la compra ya existe por external_order_id y platform
  const { data: existingPurchase } = await supabaseAdmin
    .from('purchases')
    .select('id, is_blocked')
    .eq('external_order_id', event.orderId)
    .eq('platform', event.platform)
    .single()

  let purchase = existingPurchase

  if (!purchase) {
    // Insertar la compra de forma IDEMPOTENTE con el flag is_blocked
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
        is_blocked: isBlocked, // <-- Guardamos la bandera de bloqueo
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

  // Validación de seguridad para TypeScript
  if (!purchase) {
    throw new Error('No se pudo obtener ni registrar la compra.')
  }

  if (!existingPurchase) {
    console.log('🎉 Compra guardada con éxito en la BD:', purchase.id)
  } else {
    console.log(`ℹ️ Reutilizando compra existente ID: ${purchase.id}`)
  }

  // SI ESTÁ BLOQUEADO: Detenemos la generación de token y el envío de email
  if (purchase.is_blocked || isBlocked) {
    console.warn(`🛑 Compra ${purchase.id} bloqueada por lista negra. Se omite el envío del correo.`)
    return {
      success: true,
      duplicated: !!existingPurchase,
      blocked: true,
      purchaseId: purchase.id,
      message: 'Compra registrada con flag is_blocked = true. Se omitió la entrega.',
    }
  }

  // 3. Generar o recuperar el token de acceso (solo para compradores válidos)
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
    blocked: false,
    purchaseId: purchase.id,
    accessToken: activeToken,
    emailSent: emailResult.success,
  }
}