import * as React from 'react'

interface ReportNotificationEmailProps {
  creatorName: string
  productName: string
  contentUrl: string
  description: string
  dashboardUrl: string
}

export const ReportNotificationEmail = ({
  creatorName,
  productName,
  contentUrl,
  description,
  dashboardUrl,
}: ReportNotificationEmailProps) => (
  <div style={{ fontFamily: 'sans-serif', backgroundColor: '#090d16', color: '#f3f4f6', padding: '32px 16px' }}>
    <div style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#111827', borderRadius: '12px', padding: '32px', border: '1px solid #1f2937' }}>
      <h2 style={{ color: '#f87171', marginTop: 0 }}>🚨 Nueva denuncia de contenido pirata</h2>
      
      <p style={{ fontSize: '15px', color: '#d1d5db' }}>
        Hola <strong>{creatorName}</strong>,
      </p>
      
      <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5' }}>
        Hemos recibido un nuevo reporte de la comunidad sobre la posible redistribución no autorizada de tu contenido.
      </p>

      <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', margin: '20px 0' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#9ca3af' }}>
          <strong>Producto / Creadora reportada:</strong> {productName}
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#9ca3af' }}>
          <strong>Enlace detectado:</strong> <a href={contentUrl} style={{ color: '#60a5fa' }} target="_blank" rel="noreferrer">{contentUrl}</a>
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
          <strong>Detalles de la infracción:</strong> {description}
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '28px' }}>
        <a
          href={dashboardUrl}
          style={{
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            display: 'inline-block',
          }}
        >
          Ver Reporte en el Dashboard
        </a>
      </div>

      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '32px', textAlign: 'center' }}>
        Este es un correo automático enviado por el sistema de protección contra la piratería.
      </p>
    </div>
  </div>
)