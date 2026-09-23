// src/app/dashboard/products/actions.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { uploadFile } from '@/lib/storage/r2'

const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  platform: z.enum(['tiendanube', 'shopify']),
  externalId: z.string().min(1, 'El ID externo de la plataforma es obligatorio'),
})

export type FormState = {
  message?: string
  errors?: Record<string, string[]>
  success?: boolean
  fileKey?: string
}

export async function createProduct(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = {
    name: formData.get('name'),
    platform: formData.get('platform'),
    externalId: formData.get('externalId'),
  }

  const validated = createProductSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Error de validación en los campos.',
    }
  }

  const { name, platform, externalId } = validated.data
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { message: 'No estás autenticado para realizar esta acción.' }
  }

  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (creatorError || !creator) {
    return { message: 'No se encontró el perfil de creadora asignado.' }
  }

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

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function uploadMasterFile(prevState: FormState, formData: FormData): Promise<FormState> {
  const productId = formData.get('productId') as string
  const file = formData.get('masterFile') as File | null

  if (!productId) {
    return { message: 'ID de producto no proporcionado.' }
  }

  if (!file || file.size === 0) {
    return { message: 'Por favor, seleccioná un archivo PDF válido.' }
  }

  if (file.type !== 'application/pdf') {
    return { message: 'El archivo debe ser estrictamente un documento PDF (.pdf).' }
  }

  const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
  if (file.size > MAX_SIZE_BYTES) {
    return { message: 'El archivo supera el límite de tamaño permitido (50 MB).' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const objectKey = `master/${productId}.pdf`

    await uploadFile(objectKey, buffer, 'application/pdf')

    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('products')
      .update({ master_file_key: objectKey })
      .eq('id', productId)

    if (updateError) {
      console.error('Error al actualizar master_file_key:', updateError.message)
      return { message: `Error al guardar la referencia en la base de datos: ${updateError.message}` }
    }

    revalidatePath('/dashboard/products')
    return { message: '', success: true, fileKey: objectKey }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Error subiendo PDF a R2:', err)
    return { message: `Error en la subida a R2: ${errorMessage}` }
  }
}