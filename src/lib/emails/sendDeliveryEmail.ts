// src/lib/emails/sendDeliveryEmail.ts
import { Resend } from 'resend'
import DeliveryEmail from '../../../emails/DeliveryEmail'

// Instanciación bajo demanda para evitar errores durante el build
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY no está configurada en las variables de entorno.')
    return null
  }
  return new Resend(apiKey)
}

interface SendDeliveryEmailParams {
  buyerEmail: string
  productName: string
  token: string
}

export async function sendDeliveryEmail({
  buyerEmail,
  productName,
  token,
}: SendDeliveryEmailParams) {
  const resend = getResendClient()

  if (!resend) {
    console.error('❌ No se pudo enviar el email: falta RESEND_API_KEY.')
    return { success: false, error: 'Falta RESEND_API_KEY' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const downloadUrl = `${baseUrl}/download/${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Entregas <onboarding@resend.dev>', // Dominio de prueba predeterminado de Resend
      to: buyerEmail,
      subject: `Tu acceso a ${productName}`,
      react: DeliveryEmail({
        productName,
        downloadUrl,
        buyerEmail,
      }),
    })

    if (error) {
      console.error('❌ Error devuelto por Resend al enviar email:', error)
      return { success: false, error }
    }

    console.log('✉️ Email enviado con éxito a:', buyerEmail, 'ID:', data?.id)
    return { success: true, data }
  } catch (err) {
    // Capturamos el error para NO romper el flujo del webhook
    console.error('❌ Error inesperado intentando enviar el email:', err)
    return { success: false, error: err }
  }
}