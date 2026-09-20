'use server'

import { createClient } from '@/lib/supabase/server' // O la ubicación de tu helper de Supabase server
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { uploadFile } from '@/lib/storage/r2'

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

// Server Action para subir el PDF Máster a R2 y actualizar la DB
export async function uploadMasterFile(prevState: any, formData: FormData) {
  const productId = formData.get('productId') as string
  const file = formData.get('masterFile') as File | null

  if (!productId) {
    return { message: 'ID de producto no proporcionado.' }
  }

  if (!file || file.size === 0) {
    return { message: 'Por favor, selecciona un archivo PDF válido.' }
  }

  // Validar tipo de archivo (MIME type)
  if (file.type !== 'application/pdf') {
    return { message: 'El archivo debe ser estrictamente un documento PDF (.pdf).' }
  }

  // Validar tamaño máximo (por ejemplo, 50 MB)
  const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
  if (file.size > MAX_SIZE_BYTES) {
    return { message: 'El archivo supera el límite de tamaño permitido (50 MB).' }
  }

  try {
    // Convertir el archivo a Buffer de Node.js
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Definir la key en R2: master/{productId}.pdf
    const objectKey = `master/${productId}.pdf`

    // Subir a Cloudflare R2
    await uploadFile(objectKey, buffer, 'application/pdf')

    // Actualizar la fila en Supabase
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('products')
      .update({ master_file_key: objectKey })
      .eq('id', productId)

    if (updateError) {
      console.error('Error al actualizar master_file_key en Supabase:', updateError.message)
      return { message: `Error al guardar la referencia en la base de datos: ${updateError.message}` }
    }

    return { message: '', success: true, fileKey: objectKey }
  } catch (err: any) {
    console.error('Error subiendo PDF a R2:', err)
    return { message: `Error en la subida a R2: ${err.message || 'Error desconocido'}` }
  }
}