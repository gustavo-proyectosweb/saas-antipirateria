// src/app/download/[token]/page.tsx
export const dynamic = 'force-dynamic'
import DownloadButton from '@/app/api/download/[token]/DownloadButton'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno para Supabase Admin')
  }

  return createClient(url, key)
}

interface DownloadPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { token } = await params
  const supabaseAdmin = getSupabaseAdmin()

  // 1. Buscar token con columnas garantizadas en access_tokens, purchases y products
  const { data: tokenData, error } = await supabaseAdmin
    .from('access_tokens')
    .select(`
      id,
      token,
      download_count,
      expires_at,
      purchases (
        id,
        buyer_email,
        products (
          id,
          name,
          master_file_key
        )
      )
    `)
    .eq('token', token)
    .single()

  // 2. Manejo de error: Token no encontrado o error en BD
  if (error || !tokenData) {
    return (
      <ErrorState 
        title="Enlace no válido" 
        message="El enlace de descarga no existe o ha sido modificado. Verificá la URL o contactá al soporte del creador." 
      />
    )
  }

  // 3. Manejo de error: Token expirado
  const now = new Date()
  const expiresAt = new Date(tokenData.expires_at)
  if (now > expiresAt) {
    return (
      <ErrorState 
        title="Enlace expirado" 
        message="Tu enlace de descarga ha superado los 30 días de validez. Si necesitas acceder nuevamente a tu archivo, ponete en contacto con el soporte." 
      />
    )
  }

  // 4. Manejo de error: Límite de descargas superado (Límite por defecto: 5 descargas)
  const maxDownloads = 5
  const currentDownloads = tokenData.download_count ?? 0

  if (currentDownloads >= maxDownloads) {
    return (
      <ErrorState 
        title="Límite de descargas alcanzado" 
        message={`Has alcanzado el límite máximo permitido (${maxDownloads} descargas) para este enlace de seguridad.`} 
      />
    )
  }

  // Mapeo seguro de los datos de la compra y producto
  const purchase = Array.isArray(tokenData.purchases) 
    ? tokenData.purchases[0] 
    : tokenData.purchases

  const product = purchase?.products 
    ? (Array.isArray(purchase.products) ? purchase.products[0] : purchase.products)
    : null

  const productName = product?.name || 'Tu Producto Digital'
  const productDescription = 'Gracias por tu compra. Tu archivo está listo para ser descargado.'
  const fileKey = product?.master_file_key || '#'

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>Acceso Válido</div>
        
        <h1 style={titleStyle}>{productName}</h1>
        <p style={descriptionStyle}>{productDescription}</p>

        <div style={detailsBoxStyle}>
          <p style={detailItemStyle}>
            <strong>Comprador:</strong> {purchase?.buyer_email || 'Verificado'}
          </p>
          <p style={detailItemStyle}>
            <strong>Descargas realizadas:</strong> {currentDownloads} / {maxDownloads}
          </p>
          <p style={detailItemStyle}>
            <strong>Válido hasta:</strong> {expiresAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <DownloadButton token={token} style={downloadButtonStyle} />

        <p style={footerNoticeStyle}>
          🔒 Este archivo cuenta con protección y trazabilidad digital vinculada a tu correo electrónico.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, borderColor: '#fca5a5' }}>
        <div style={{ ...badgeStyle, backgroundColor: '#fef2f2', color: '#dc2626' }}>
          ❌ Error de acceso
        </div>
        <h1 style={{ ...titleStyle, color: '#991b1b' }}>{title}</h1>
        <p style={descriptionStyle}>{message}</p>
        <div style={{ marginTop: '24px' }}>
          <Link href="/" style={{ ...downloadButtonStyle, backgroundColor: '#4b5563', textDecoration: 'none' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  padding: '32px',
  maxWidth: '480px',
  width: '100%',
  textAlign: 'center' as const,
}

const badgeStyle = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: '600',
  backgroundColor: '#f0fdf4',
  color: '#16a34a',
  marginBottom: '16px',
}

const titleStyle = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 8px 0',
}

const descriptionStyle = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: '1.5',
  margin: '0 0 24px 0',
}

const detailsBoxStyle = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'left' as const,
  marginBottom: '24px',
}

const detailItemStyle = {
  fontSize: '13px',
  color: '#334155',
  margin: '4px 0',
}

const downloadButtonStyle = {
  display: 'block',
  width: '100%',
  padding: '14px 20px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '15px',
  borderRadius: '8px',
  textDecoration: 'none',
  boxSizing: 'border-box' as const,
  transition: 'background-color 0.2s',
}

const footerNoticeStyle = {
  fontSize: '11px',
  color: '#94a3b8',
  marginTop: '20px',
  lineHeight: '1.4',
}