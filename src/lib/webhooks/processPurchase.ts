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

  // 2. Insertar la compra de forma IDEMPOTENTE
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

  console.log('🎉 Compra guardada con éxito en la BD:', purchase.id)

  // 3. Generar el token de acceso automáticamente
  const tokenResult = await createAccessToken(purchase.id, 30)

  console.log(`🎟️ Access Token generado: ${tokenResult.token}`)

  // 4. Enviar email de entrega (envuelto en un try/catch lógico para no romper la respuesta 200 al webhook)
  const emailResult = await sendDeliveryEmail({
    buyerEmail: event.customerEmail,
    productName: product.name || 'Tu Producto Digital',
    token: tokenResult.token,
  })

  return {
    success: true,
    duplicated: false,
    purchaseId: purchase.id,
    accessToken: tokenResult.token,
    emailSent: emailResult.success,
  }
}
/*
curl -X POST http://localhost:3000/api/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "x-shopify-hmac-sha256: MOqMbVaE170/WuMSvHx63jnMx3V17GfRBP/JuIcQ5Nc=" \
  -d '{
    "id": 99990001,
    "email": "gustavo.proyectosweb@gmail.com",
    "total_price": "25.00",
    "currency": "USD",
    "line_items": [
      {
        "product_id": "12345678"
      }
    ]
  }'





  node -e '
const crypto = require("crypto");

// 1. Configura tus datos
const SECRET = "secret_super_seguro_123"; // El webhook_secret de tu tabla store_connections
const BUYER_EMAIL = "gustavo.proyectosweb@gmail.com"; // Debe ser tu email registrado en Resend
const EXTERNAL_PRODUCT_ID = "12345678"; // El external_id de la tabla products

const payload = {
  id: Date.now(),
  email: BUYER_EMAIL,
  total_price: "25.00",
  currency: "USD",
  line_items: [
    {
      product_id: EXTERNAL_PRODUCT_ID
    }
  ]
};

const rawBody = JSON.stringify(payload);
const hmac = crypto.createHmac("sha256", SECRET).update(rawBody, "utf8").digest("base64");

fetch("http://localhost:3000/api/webhooks/shopify", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-shopify-hmac-sha256": hmac
  },
  body: rawBody
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(result => console.log("\n📌 Respuesta del Webhook:\n", JSON.stringify(result, null, 2)))
.catch(err => console.error("❌ Error:", err));
'
*/