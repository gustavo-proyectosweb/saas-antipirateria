// src/app/dashboard/inspector/actions.ts

'use server'

import { createClient } from '@/lib/supabase/server'
// Importamos la función de decodificación desarrollada previamente (ajusta la ruta si difiere en tu proyecto)
import { decodeStamp } from '@/lib/forensics/stamp'

export interface ForensicResult {
  success: boolean
  stamped: boolean
  purchaseId?: string
  buyerEmail?: string
  productName?: string
  purchaseDate?: string
  rawMetadata?: Record<string, any>
  message?: string
}

export async function analyzeForensicFile(formData: FormData): Promise<ForensicResult> {
  try {
    const file = formData.get('file') as File

    if (!file) {
      return {
        success: false,
        stamped: false,
        message: 'No se recibió ningún archivo PDF.',
      }
    }

    // Convertimos el archivo recibido a Buffer para poder procesarlo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 1. Ejecutar la decodificación del PDF
    const decodedData = await decodeStamp(buffer)

    if (!decodedData || !decodedData.purchaseId) {
      return {
        success: true,
        stamped: false,
        message: 'El archivo analizado no contiene marcas de agua digitales o firmas forenses reconocibles.',
      }
    }

    const { purchaseId, ...rawMetadata } = decodedData

    // 2. Si encontramos un purchaseId, consultamos la base de datos en Supabase
    const supabase = await createClient()

    const { data: purchase, error } = await supabase
      .from('purchases')
      .select(`
        id,
        buyer_email,
        created_at,
        products (
          name
        )
      `)
      .eq('id', purchaseId)
      .maybeSingle()

    if (error || !purchase) {
      return {
        success: true,
        stamped: true,
        purchaseId,
        rawMetadata,
        message: 'Se detectó la marca de agua forense, pero el registro de compra no fue encontrado en la base de datos.',
      }
    }

    const productObj = Array.isArray(purchase.products)
      ? purchase.products[0]
      : purchase.products

    return {
      success: true,
      stamped: true,
      purchaseId: purchase.id,
      buyerEmail: purchase.buyer_email,
      productName: productObj?.name || 'Producto no especificado',
      purchaseDate: purchase.created_at,
      rawMetadata,
      message: '¡Marca forense identificada y verificada exitosamente!',
    }
  } catch (err: any) {
    console.error('Error durante el análisis forense:', err)
    return {
      success: false,
      stamped: false,
      message: err.message || 'Ocurrió un error inesperado al analizar el archivo PDF.',
    }
  }
}