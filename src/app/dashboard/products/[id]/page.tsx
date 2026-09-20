'use client'

import { useActionState, use } from 'react'
import { uploadMasterFile } from '../actions'
import Link from 'next/link'

const initialState = {
  message: '',
  success: false,
  fileKey: '',
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Desempaquetar la promesa de params con use()
  const resolvedParams = use(params)
  const [state, formAction] = useActionState(uploadMasterFile, initialState)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Configurar PDF Máster</h1>
        <Link
          href="/dashboard/products"
          className="text-sm text-gray-400 hover:text-white transition"
        >
          ← Volver a productos
        </Link>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-200 mb-2">
          Subir Documento PDF Máster (Original)
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Este es el archivo base que se personalizará y protegerá automáticamente con marcas forenses cada vez que una clienta lo descargue.
        </p>

        {state?.message && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-sm">
            {state.message}
          </div>
        )}

        {state?.success && (
          <div className="mb-4 p-3 bg-green-900/40 border border-green-500/50 rounded text-green-200 text-sm">
            ¡PDF Máster subido con éxito! Ruta guardada: <code className="font-mono">{state.fileKey}</code>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="productId" value={resolvedParams.id} />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Archivo PDF del Kit Imprimible
            </label>
            <input
              type="file"
              name="masterFile"
              accept="application/pdf"
              required
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer bg-gray-900 border border-gray-700 rounded-lg p-2"
            />
            <p className="text-xs text-gray-500 mt-1">Solo archivos .pdf (Máximo 50 MB).</p>
          </div>

          <div className="pt-4 border-t border-gray-800 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
            >
              Subir PDF a R2
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}