'use server'

import { decodeStamp } from '@/lib/forensics/stamp'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function analyzeForensicFile(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) throw new Error('No se recibió ningún archivo.')

    const arrayBuffer = await file.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // Decodifica la marca en el buffer recibido
    const decoded = await decodeStamp(pdfBuffer)

    if (!decoded || !decoded.purchaseId) {
      return { found: false }
    }

    // Consulta los detalles de la compra en la base de datos
    const supabase = getSupabaseAdmin()
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*, products(name)')
      .eq('id', decoded.purchaseId)
      .single()

    if (error || !purchase) {
      return {
        found: true,
        purchaseId: decoded.purchaseId,
        buyerEmail: 'Email no localizado en BD',
        productName: 'Producto desconocido',
        purchaseDate: 'Fecha no registrada',
      }
    }

    return {
      found: true,
      purchaseId: purchase.id,
      buyerEmail: purchase.buyer_email,
      productName: purchase.products?.name || 'Documento Digital',
      purchaseDate: new Date(purchase.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  } catch (err: any) {
    console.error('Error al analizar archivo forense:', err)
    return { found: false, error: err.message }
  }
}