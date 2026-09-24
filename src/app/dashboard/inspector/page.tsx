'use client'

import { useState } from 'react'
import { analyzeForensicFile } from './actions'
import { ShieldCheck, ShieldAlert, Upload, UserX, CheckCircle2 } from 'lucide-react'

interface InspectionResult {
  found: boolean
  purchaseId?: string
  buyerEmail?: string
  productName?: string
  purchaseDate?: string
  methodFound?: string
  error?: string
}

export default function InspectorPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InspectionResult | null>(null)
  const [blacklisted, setBlacklisted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setBlacklisted(false)
    }
  }

  // Eventos para Drag and Drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile)
        setResult(null)
        setBlacklisted(false)
      }
    }
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    setBlacklisted(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await analyzeForensicFile(formData)
      setResult(res)
    } catch (err) {
      setResult({
        found: false,
        error: 'Ocurrió un error al procesar el archivo. Inténtalo de nuevo.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToBlacklist = async () => {
    setBlacklisted(true)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Inspector Forense de PDF 🔍
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Sube un PDF sospechoso o filtrado para verificar sus marcas invisibles e identificar al comprador original.
        </p>
      </div>

      {/* Zona de Dropzone / Carga de Archivo */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-gray-700 hover:border-indigo-500 bg-gray-900/50'
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white font-medium">
              {file ? file.name : 'Haz clic para seleccionar o arrastra un archivo PDF'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {file
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB — listo para inspeccionar`
                : 'Formatos soportados: .pdf'}
            </p>
          </div>
        </label>
      </div>

      {/* Botones de Acción */}
      {file && (
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analizando capas forenses...
              </>
            ) : (
              'Analizar PDF'
            )}
          </button>
          <button
            onClick={() => {
              setFile(null)
              setResult(null)
            }}
            className="px-4 py-2.5 text-gray-400 hover:text-white transition text-sm"
          >
            Quitar archivo
          </button>
        </div>
      )}

      {/* TARJETA DE RESULTADOS */}
      {result && (
        <div className="space-y-6">
          {result.found ? (
            /* CASO 1: MARCA DETECTADA */
            <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-6 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Marca Forense Identificada</h3>
                    <p className="text-emerald-400 text-xs">Origen del archivo verificado exitosamente</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Infractor Detectado
                </span>
              </div>

              {/* Detalle de Información de Compra */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/60 p-4 rounded-lg border border-gray-800">
                <div>
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">Comprador Original</span>
                  <span className="text-base font-mono font-medium text-white break-all">{result.buyerEmail}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">Producto</span>
                  <span className="text-base font-medium text-white">{result.productName || 'Documento Protegido'}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">Fecha de Compra</span>
                  <span className="text-sm font-medium text-gray-300">{result.purchaseDate || 'Registrada en sistema'}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">ID de Compra</span>
                  <span className="text-xs font-mono text-gray-400 break-all">{result.purchaseId}</span>
                </div>
              </div>

              {/* Botón de Lista Negra */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-400">
                  ¿Deseas bloquear las descargas de este usuario en tu plataforma?
                </p>
                {blacklisted ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Usuario en Lista Negra
                  </span>
                ) : (
                  <button
                    onClick={handleAddToBlacklist}
                    className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-medium text-sm rounded-lg transition flex items-center gap-2 shadow-lg shadow-red-900/20"
                  >
                    <UserX className="w-4 h-4" /> Agregar a Lista Negra
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* CASO 2: NO DETECTADO */
            <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">No se Pudo Identificar el Origen</h3>
                  <p className="text-amber-400/80 text-xs">Sin marcas forenses reconocibles</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed pt-2 border-t border-amber-500/10">
                El documento analizado no contiene huellas digitales activas. Esto puede deberse a que el archivo no fue procesado por nuestro sistema, o a que fue completamente rasterizado (convertido en imágenes escaneadas/capturas de pantalla) antes de ser compartido.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}