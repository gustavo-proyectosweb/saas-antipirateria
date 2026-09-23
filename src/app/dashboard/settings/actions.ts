// src/app/dashboard/settings/actions.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveStoreConnection(formData: FormData) {
  const platform = formData.get('platform') as string
  const externalStoreId = formData.get('externalStoreId') as string
  const webhookSecret = formData.get('webhookSecret') as string

  if (!platform || !webhookSecret) {
    return { success: false, error: 'La plataforma y el Webhook Secret son obligatorios.' }
  }

  const supabase = await createClient()

  // 1. Obtener el usuario autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No estás autenticado para realizar esta acción.' }
  }

  // 2. Obtener el perfil de la creadora
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (creatorError || !creator) {
    return { success: false, error: 'No se encontró el perfil de creadora asignado.' }
  }

  // 3. Upsert de la conexión
  const { error: upsertError } = await supabase
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

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function getStoreConnection(platform: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!creator) return null

  const { data: connection } = await supabase
    .from('store_connections')
    .select('platform, external_store_id, webhook_secret')
    .eq('creator_id', creator.id)
    .eq('platform', platform)
    .maybeSingle()

  return connection
}