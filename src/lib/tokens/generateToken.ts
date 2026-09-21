// src/lib/tokens/generateToken.ts
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno requeridas para Supabase Admin')
  }

  return createClient(url, key)
}

export interface AccessTokenResult {
  token: string
  expiresAt: Date
  tokenId: string
}

/**
 * Genera un token de acceso UUID v4 seguro y lo registra en la tabla access_tokens.
 * @param purchaseId ID de la compra en la tabla purchases
 * @param expirationDays Días de validez del token (por defecto 30)
 */
export async function createAccessToken(
  purchaseId: string,
  expirationDays: number = 30
): Promise<AccessTokenResult> {
  const supabaseAdmin = getSupabaseAdmin()

  // 1. Generar token UUID v4 criptográficamente seguro
  const token = crypto.randomUUID()

  // 2. Calcular fecha de expiración (ej. 30 días a partir de hoy)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expirationDays)

  // 3. Insertar el token en la base de datos
  const { data, error } = await supabaseAdmin
    .from('access_tokens')
    .insert({
      purchase_id: purchaseId,
      token: token,
      download_count: 0,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('❌ Error guardando el token de acceso:', error)
    throw new Error(`Error al crear el token de acceso: ${error.message}`)
  }

  return {
    token,
    expiresAt,
    tokenId: data.id,
  }
}