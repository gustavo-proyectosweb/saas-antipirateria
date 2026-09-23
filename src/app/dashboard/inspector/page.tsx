// src/app/dashboard/inspector/page.tsx

'use client'

import { useState, useTransition } from 'react'

export default function InspectorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Manejadores para arrastrar y soltar (Drag & Drop)
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

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        setAnalysisResult(null)
      } else {
        alert('Por favor, selecciona un archivo en formato PDF.')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        setAnalysisResult(null)
      } else {
        alert('Por favor, selecciona un archivo en formato PDF.')
      }
    }
  }

  // Simulación de análisis (por ahora no conecta con el backend)
  const handleAnalyze = () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setAnalysisResult(null)

    // Simulamos un retraso de 2.5 segundos para mostrar el estado "Analizando..."
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisResult('Simulación completada. El análisis en backend se conectará en la siguiente tarea.')
    }, 2500)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setIsAnalyzing(false)
    setAnalysisResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Inspector Forense de PDF 🔍
        </h1>
        <p className="text-sm text-gray-400">
          Sube un PDF para analizar sus metadatos, firmas digitales y marcas de agua invisibles.
        </p>
      </div>

      {/* ÁREA DE CARGA / DRAG & DROP */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/20'
            : selectedFile
            ? 'border-green-500/50 bg-gray-900/50'
            : 'border-gray-800 bg-gray-950 hover:border-gray-700'
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={isAnalyzing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="pdf-inspector-input"
        />

        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-2xl">
            📄
          </div>

          {selectedFile ? (
            <div>
              <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Archivo PDF listo
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-200">
                Arrastra tu PDF aquí o <span className="text-indigo-400 underline">selecciona un archivo</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Solo archivos PDF (Máx. 50MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      {selectedFile && (
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition text-sm flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Analizando...</span>
              </>
            ) : (
              <span>Analizar PDF</span>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={isAnalyzing}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2.5 rounded-lg transition text-sm disabled:opacity-50"
          >
            Quitar archivo
          </button>
        </div>
      )}

      {/* ÁREA DE RESULTADOS */}
      {isAnalyzing && (
        <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-1/4"></div>
          <div className="h-3 bg-gray-900 rounded w-3/4"></div>
          <div className="h-3 bg-gray-900 rounded w-1/2"></div>
        </div>
      )}

      {analysisResult && (
        <div className="bg-gray-950 border border-indigo-500/30 p-6 rounded-xl space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span>📊</span>
            <span>Resultado del Análisis</span>
          </h2>
          <p className="text-sm text-gray-300">{analysisResult}</p>
        </div>
      )}
    </div>
  )
}