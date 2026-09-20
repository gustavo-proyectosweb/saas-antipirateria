// src/app/dashboard/settings/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'

// Usamos el cliente admin con Service Role para gestionar credenciales en el servidor
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno requeridas para Supabase Admin')
  }

  return createClient(url, key)
}

export async function saveStoreConnection(formData: FormData) {
  const platform = formData.get('platform') as string
  const externalStoreId = formData.get('externalStoreId') as string
  const webhookSecret = formData.get('webhookSecret') as string

  if (!platform || !webhookSecret) {
    return { success: false, error: 'La plataforma y el Webhook Secret son obligatorios.' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  // 1. Para el MVP, obtenemos el primer creador registrado
  const { data: creator, error: creatorError } = await supabaseAdmin
    .from('creators')
    .select('id')
    .limit(1)
    .single()

  if (creatorError || !creator) {
    return { success: false, error: 'No se encontró el perfil de creador.' }
  }

  // 2. Guardar o actualizar (upsert) en store_connections
  const { error: upsertError } = await supabaseAdmin
    .from('store_connections')
    .upsert(
      {
        creator_id: creator.id,
        platform,
        external_store_id: externalStoreId || null,
        webhook_secret: webhookSecret,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'creator_id,platform' }
    )

  if (upsertError) {
    console.error('Error al guardar conexión:', upsertError)
    return { success: false, error: 'Error al guardar las credenciales en la base de datos.' }
  }

  return { success: true }
}

export async function getStoreConnection(platform: string) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: creator } = await supabaseAdmin
    .from('creators')
    .select('id')
    .limit(1)
    .single()

  if (!creator) return null

  const { data: connection } = await supabaseAdmin
    .from('store_connections')
    .select('platform, external_store_id, webhook_secret')
    .eq('creator_id', creator.id)
    .eq('platform', platform)
    .single()

  return connection
}