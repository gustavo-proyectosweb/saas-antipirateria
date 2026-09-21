'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DownloadButtonProps {
  token: string
  style: React.CSSProperties
}

export default function DownloadButton({ token, style }: DownloadButtonProps) {
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)

    try {
      // 1. Solicitamos el archivo a la API (esto procesa el PDF e incrementa el contador en Supabase)
      const response = await fetch(`/api/download/${token}`)

      if (!response.ok) {
        alert('Ocurrió un error al procesar la descarga.')
        setIsDownloading(false)
        return
      }

      // 2. Convertimos la respuesta en un blob para forzar la descarga en el navegador
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Intentamos obtener el nombre del archivo desde los headers o usamos uno por defecto
      a.download = `descarga_${token.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      // 3. Como la API ya terminó de guardar el incremento en Supabase, refrescamos los Server Components
      router.refresh()
    } catch (error) {
      console.error('Error durante la descarga:', error)
      alert('Error de conexión al descargar.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button 
      onClick={handleDownload} 
      disabled={isDownloading}
      style={{ ...style, border: 'none', cursor: isDownloading ? 'wait' : 'pointer', opacity: isDownloading ? 0.7 : 1 }}
    >
      {isDownloading ? '⏳ Procesando PDF...' : '⬇️ Descargar mi archivo'}
    </button>
  )
}