// emails/DeliveryEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface DeliveryEmailProps {
  productName?: string
  downloadUrl?: string
  buyerEmail?: string
}

export const DeliveryEmail = ({
  productName = 'Tu Producto Digital',
  downloadUrl = 'https://miapp.com/download/ejemplo-token-123',
  buyerEmail = 'comprador@ejemplo.com',
}: DeliveryEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Tu acceso a {productName} ya está disponible</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>¡Gracias por tu compra!</Heading>
          
          <Text style={paragraph}>
            Tu pago ha sido procesado exitosamente. Ya podés descargar tu copia de{' '}
            <strong>{productName}</strong>.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href={downloadUrl}>
              Descargar {productName}
            </Button>
          </Section>

          <Text style={paragraph}>
            O copia y pega el siguiente enlace en tu navegador:
          </Text>
          <Text style={linkText}>{downloadUrl}</Text>

          <Hr style={hr} />

          <Section style={noticeBox}>
            <Text style={noticeTitle}>🛡️ Información importante de seguridad</Text>
            <Text style={noticeText}>
              Este archivo ha sido personalizado y estampado digitalmente con tu correo electrónico (
              <strong>{buyerEmail}</strong>) para proteger la propiedad intelectual del autor y prevenir su redistribución no autorizada.
            </Text>
          </Section>

          <Text style={footer}>
            Este enlace es personal e intransferible. Si tenés alguna duda con tu compra, respondé a este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default DeliveryEmail

// --- Estilos Inline para compatibilidad con clientes de Email ---

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}

const paragraph = {
  color: '#444444',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const btnContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
}

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const linkText = {
  color: '#2563eb',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '0 0 24px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}

const noticeBox = {
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #2563eb',
  padding: '16px',
  borderRadius: '4px',
  margin: '20px 0',
}

const noticeTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 6px',
}

const noticeText = {
  color: '#475569',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  marginTop: '24px',
}