'use server'

import { reportFormSchema } from '@/lib/schemas/reportSchema'

type SubmitReportResult = {
  success: boolean
  message: string
}

export async function submitPublicReport(
  formData: unknown,
  turnstileToken: string,
  honeypotValue: string
): Promise<SubmitReportResult> {
  // 1. Verificación de Honeypot
  if (honeypotValue) {
    console.warn('[Anti-Spam] Intento de spam detectado por campo Honeypot.')
    return {
      success: false,
      message: 'Solicitud rechazada.',
    }
  }

  // 2. Verificación de presencia del Token
  if (!turnstileToken) {
    return {
      success: false,
      message: 'Por favor, completa la verificación de seguridad (Captcha).',
    }
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x000000000000000000000000000000AA'

  // Si estamos en entorno local/desarrollo y usamos el token dummy de prueba
  const isDummyToken = turnstileToken.includes('DUMMY.TOKEN') || turnstileToken === 'XXXX.DUMMY.TOKEN.XXXX'

  if (process.env.NODE_ENV === 'development' && isDummyToken) {
    console.log('🧪 [Dev Mode] Token de prueba Cloudflare detectado y aprobado localmente.')
  } else {
    try {
      const params = new URLSearchParams()
      params.append('secret', secretKey)
      params.append('response', turnstileToken)

      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      )

      const verifyData = await verifyRes.json()

      if (!verifyData.success) {
        console.warn('[Anti-Spam] Validación de Turnstile fallida:', verifyData)
        return {
          success: false,
          message: 'Verificación de seguridad fallida. Inténtalo de nuevo.',
        }
      }
    } catch (error) {
      console.error('Error al validar Turnstile con Cloudflare:', error)
      return {
        success: false,
        message: 'Error de conexión al verificar el captcha.',
      }
    }
  }

  // 3. Validación Zod de los datos del formulario
  const parsed = reportFormSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Los datos enviados no son válidos.',
    }
  }

  console.log('✅ Denuncia registrada con éxito:', parsed.data)

  return {
    success: true,
    message: 'Denuncia registrada con éxito.',
  }
}