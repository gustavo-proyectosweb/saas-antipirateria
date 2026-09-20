'use server'

import { createClient } from '@/lib/supabase/server' // O la ubicación de tu helper de Supabase server
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Esquema de validación con Zod
const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  platform: z.enum(['tiendanube', 'shopify']),
  externalId: z.string().min(1, 'El ID externo de la plataforma es obligatorio'),
})

export async function createProduct(prevState: any, formData: FormData) {
  // 1. Extraer datos del FormData
  const rawData = {
    name: formData.get('name'),
    platform: formData.get('platform'),
    externalId: formData.get('externalId'),
  }

  // 2. Validar campos con Zod
  const validated = createProductSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Error de validación en los campos.',
    }
  }

  const { name, platform, externalId } = validated.data

  // 3. Crear cliente de Supabase autenticado
  const supabase = await createClient()

  // Obtener el usuario autenticado actual
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { message: 'No estás autenticado para realizar esta acción.' }
  }

  // 4. Buscar el id del registro en public.creators correspondiente al usuario
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (creatorError || !creator) {
    return { message: 'No se encontró el perfil de creadora asignado.' }
  }

  // 5. Insertar en la tabla products (RLS asegura la propiedad)
  const { error: insertError } = await supabase.from('products').insert({
    creator_id: creator.id,
    name,
    platform,
    external_id: externalId,
  })

  if (insertError) {
    console.error('Error insertando producto:', insertError.message)
    return { message: `Error al guardar en la base de datos: ${insertError.message}` }
  }

  // Redirigir al listado de productos tras el éxito
  redirect('/dashboard/products')
}