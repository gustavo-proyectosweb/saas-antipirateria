'use server'

import { reportFormSchema } from '@/lib/schemas/reportSchema'
import { createClient } from '@/lib/supabase/server'
import { decodeStamp } from '@/lib/forensics/stamp'

type SubmitReportResult = {
  success: boolean
  message: string
}

export async function submitPublicReport(
  formDataInput: unknown,
  turnstileToken: string,
  honeypotValue: string
): Promise<SubmitReportResult> {
  // 1. Anti-Spam: Honeypot
  if (honeypotValue) {
    console.warn('[Anti-Spam] Intento de spam detectado por campo Honeypot.')
    return { success: false, message: 'Solicitud rechazada.' }
  }

  // 2. Anti-Spam: Token Captcha
  if (!turnstileToken) {
    return { success: false, message: 'Por favor, completa la verificación de seguridad (Captcha).' }
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x000000000000000000000000000000AA'
  const isDummyToken = turnstileToken.includes('DUMMY.TOKEN') || turnstileToken === 'XXXX.DUMMY.TOKEN.XXXX'

  if (process.env.NODE_ENV === 'development' && isDummyToken) {
    console.log('🧪 [Dev Mode] Token de prueba Cloudflare detectado y aprobado localmente.')
  } else {
    try {
      const params = new URLSearchParams()
      params.append('secret', secretKey)
      params.append('response', turnstileToken)

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })

      const verifyData = await verifyRes.json()
      if (!verifyData.success) {
        return { success: false, message: 'Verificación de seguridad fallida. Inténtalo de nuevo.' }
      }
    } catch (error) {
      console.error('Error al validar Turnstile:', error)
      return { success: false, message: 'Error de conexión al verificar el captcha.' }
    }
  }

  // 3. Normalizar datos de entrada (si viene FormData o JS Object)
  let rawData: Record<string, unknown> = {}
  let file: File | null = null

  if (formDataInput instanceof FormData) {
    rawData = {
      contentUrl: formDataInput.get('contentUrl'),
      productName: formDataInput.get('productName'),
      description: formDataInput.get('description'),
      reporterEmail: formDataInput.get('reporterEmail') || undefined,
    }
    file = formDataInput.get('evidenceFile') as File | null
  } else if (typeof formDataInput === 'object' && formDataInput !== null) {
    rawData = formDataInput as Record<string, unknown>
  }

  // Validar con Zod
  const parsed = reportFormSchema.safeParse(rawData)
  if (!parsed.success) {
    console.error('Error de validación Zod:', parsed.error.format())
    return { success: false, message: 'Los datos enviados no son válidos.' }
  }

  const { productName, description, contentUrl, reporterEmail } = parsed.data

  let matchedCreatorId: string | null = null
  const supabase = await createClient()

  // 4. Matching Forense con decodeStamp si hay PDF adjunto
  if (file && file.size > 0 && file.type === 'application/pdf') {
    try {
      console.log('🔍 [Forensics] Analizando PDF adjunto con decodeStamp...')
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const stampResult = await decodeStamp(buffer)

      if (stampResult && stampResult.purchaseId) {
        console.log('🎯 [Forensics] Marca detectada en PDF. Purchase ID:', stampResult.purchaseId)

        const { data: purchaseData } = await supabase
          .from('purchases')
          .select('creator_id')
          .eq('id', stampResult.purchaseId)
          .single()

        if (purchaseData?.creator_id) {
          matchedCreatorId = purchaseData.creator_id
          console.log('✅ [Match Exitoso] Creadora vinculada:', matchedCreatorId)
        }
      } else if (stampResult && stampResult.creatorId) {
        matchedCreatorId = stampResult.creatorId
        console.log('✅ [Match Exitoso] Creadora vinculada directamente:', matchedCreatorId)
      } else {
        console.log('ℹ️ [Forensics] El PDF no contiene marcas forenses reconocibles.')
      }
    } catch (forensicError) {
      console.warn('⚠️ Error al decodificar marca forense en el PDF:', forensicError)
    }
  }

  // 5. Guardar en Supabase (community_reports)
  try {
    const { error } = await supabase.from('community_reports').insert({
      product_name: productName,
      description: description,
      content_url: contentUrl,
      reporter_email: reporterEmail || null,
      status: 'pending',
      matched_creator_id: matchedCreatorId,
    })

    if (error) {
      console.error('Error al guardar en community_reports:', error)
      return { success: false, message: 'Ocurrió un error al registrar la denuncia en el sistema.' }
    }

    console.log('✅ Reporte registrado exitosamente en la DB.')
    return {
      success: true,
      message: 'Denuncia registrada con éxito.',
    }
  } catch (dbError) {
    console.error('Error inesperado de base de datos:', dbError)
    return { success: false, message: 'Error interno del servidor.' }
  }
}