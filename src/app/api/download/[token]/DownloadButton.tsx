// src/app/api/download/[token]/DownloadButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DownloadButtonProps {
  token: string
  style?: React.CSSProperties
  className?: string
}

export default function DownloadButton({ token, style, className }: DownloadButtonProps) {
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)

    try {
      // 1. Solicitamos el archivo a la API de descarga
      const response = await fetch(`/api/download/${token}`)

      if (!response.ok) {
        let errorMessage = 'Ocurrió un error al procesar la descarga.'
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            errorMessage = errorData.error
          }
        } catch {
          // Si el cuerpo no es JSON, mantenemos el mensaje por defecto
        }

        alert(errorMessage)
        setIsDownloading(false)
        return
      }

      // 2. Extraer el nombre de archivo sugerido en la cabecera Content-Disposition
      const disposition = response.headers.get('Content-Disposition')
      let filename = `descarga_${token.slice(0, 8)}.pdf`

      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) {
          filename = match[1]
        }
      }

      // 3. Convertir a blob e iniciar descarga
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()

      // Retardamos la revocación para asegurar la compatibilidad entre navegadores
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 100)

      // 4. Refrescar Server Components para sincronizar el estado del contador de descargas
      router.refresh()
    } catch (error) {
      console.error('Error durante la descarga:', error)
      alert('Error de conexión al intentar descargar el archivo.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
      style={{
        ...style,
        border: style?.border || 'none',
        cursor: isDownloading ? 'wait' : 'pointer',
        opacity: isDownloading ? 0.7 : 1,
      }}
    >
      {isDownloading ? '⏳ Procesando PDF...' : '⬇️ Descargar mi archivo'}
    </button>
  )
}