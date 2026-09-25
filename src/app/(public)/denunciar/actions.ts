'use server'

import { reportFormSchema } from '@/lib/schemas/reportSchema'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decodeStamp } from '@/lib/forensics/stamp'
import { Resend } from 'resend'
import { ReportNotificationEmail } from '@/components/emails/ReportNotificationEmail'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  // 3. Normalizar datos de entrada
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
  const supabase = createAdminClient()

  // 4. Match Nivel 1: Forense vía decodeStamp en PDF
  if (file && file.size > 0 && file.type === 'application/pdf') {
    try {
      console.log('🔍 [Forensics] Analizando PDF adjunto con decodeStamp...')
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const stampResult = await decodeStamp(buffer)

      if (stampResult && stampResult.purchaseId) {
        console.log('🎯 [Forensics] Marca detectada en PDF. Purchase ID:', stampResult.purchaseId)

        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .select('creator_id')
          .eq('id', stampResult.purchaseId)
          .maybeSingle()

        if (purchaseError) {
          console.warn('⚠️ Error al consultar la compra:', purchaseError.message)
        }

        if (purchaseData?.creator_id) {
          matchedCreatorId = purchaseData.creator_id
          console.log('✅ [Match Forense Exitoso] Creadora vinculada:', matchedCreatorId)
        } else {
          console.log('ℹ️ El purchaseId no existe en la DB. Pasando a búsqueda por texto...')
        }
      }
    } catch (forensicError) {
      console.warn('⚠️ Error al decodificar marca forense en el PDF:', forensicError)
    }
  }

  // 5. Match Nivel 2: Búsqueda por texto (solo si no hubo match forense previo)
  if (!matchedCreatorId && productName) {
    try {
      console.log(`🔍 [Text Match] Buscando creadora relacionada en 'creators' con: "${productName}"...`)
      
      const { data: creatorMatch } = await supabase
        .from('creators')
        .select('id, store_name')
        .ilike('store_name', `%${productName.trim()}%`)
        .limit(1)
        .maybeSingle()

      if (creatorMatch?.id) {
        matchedCreatorId = creatorMatch.id
        console.log('✅ [Match por Texto Exitoso] Tienda/Creadora encontrada:', creatorMatch.store_name)
      }
    } catch (textMatchError) {
      console.warn('⚠️ Error al realizar la búsqueda por texto:', textMatchError)
    }
  }

  // 6. Guardar en Supabase (community_reports)
  try {
    const { data: report, error } = await supabase
      .from('community_reports')
      .insert({
        product_name: productName,
        description: description,
        content_url: contentUrl,
        reporter_email: reporterEmail || null,
        status: 'pending',
        matched_creator_id: matchedCreatorId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error al guardar en community_reports:', error)
      return { success: false, message: 'Ocurrió un error al registrar la denuncia en el sistema.' }
    }

    console.log('✅ Reporte registrado exitosamente en la DB con ID:', report.id)

    // 7. Enviar Email a la Creadora (si hubo match)
    if (matchedCreatorId) {
      try {
        const { data: creatorData } = await supabase
          .from('creators')
          .select('store_name, user_id')
          .eq('id', matchedCreatorId)
          .maybeSingle()

        if (creatorData?.user_id) {
          // Intentamos obtener los datos del usuario
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', creatorData.user_id)
            .maybeSingle()

          const recipientEmail = userData?.email

          if (recipientEmail && process.env.RESEND_API_KEY) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const dashboardUrl = `${appUrl}/dashboard/reports`

            console.log(`📧 [Resend] Enviando notificación por email a: ${recipientEmail}`)

            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'Anti-Piratería <onboarding@resend.dev>',
              to: recipientEmail,
              subject: `🚨 Nueva denuncia de piratería recibida: ${productName}`,
              react: React.createElement(ReportNotificationEmail, {
                creatorName: creatorData.store_name || 'Creadora',
                productName: productName,
                contentUrl: contentUrl,
                description: description,
                dashboardUrl: dashboardUrl,
              }),
            })

            console.log('✉️ Email enviado con éxito vía Resend.')
          }
        }
      } catch (emailError) {
        console.error('⚠️ Error al enviar el correo con Resend:', emailError)
      }
    }

    return {
      success: true,
      message: 'Denuncia registrada con éxito.',
    }
  } catch (dbError) {
    console.error('Error inesperado de base de datos:', dbError)
    return { success: false, message: 'Error interno del servidor.' }
  }
}