'use client'

import { useEffect, useState } from 'react'
import { getBlocklistEntries } from './actions'
import { ShieldX, Lock, Calendar, FileBadge } from 'lucide-react'

interface Blockentry {
  id: string
  buyer_email_hash: string
  reason: string
  source: string
  created_at: string
}

export default function BlocklistPage() {
  const [entries, setEntries] = useState<Blockentry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    const res = await getBlocklistEntries()
    if (res.success) {
      setEntries(res.entries)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Lista Negra de Compradores <ShieldX className="w-6 h-6 text-red-500" />
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Histórico de usuarios bloqueados para descargas. Los correos están hasheados mediante criptografía SHA-256 para preservar la privacidad.
        </p>
      </div>

      {/* Lista de Registros */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400 gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          Cargando lista negra...
        </div>
      ) : entries.length === 0 ? (
        <div className="border border-gray-800 bg-gray-900/50 rounded-xl p-8 text-center text-gray-400">
          No hay usuarios en la lista negra actualmente.
        </div>
      ) : (
        <div className="border border-gray-800 bg-gray-900/60 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/60 text-xs uppercase text-gray-400 border-b border-gray-700">
              <tr>
                <th className="py-3.5 px-4">Hash del Correo (SHA-256)</th>
                <th className="py-3.5 px-4">Motivo</th>
                <th className="py-3.5 px-4">Origen</th>
                <th className="py-3.5 px-4">Fecha de Bloqueo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-800/30 transition">
                  <td className="py-3.5 px-4 font-mono text-xs text-indigo-300 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate max-w-[200px]" title={entry.buyer_email_hash}>
                      {entry.buyer_email_hash}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white">{entry.reason}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                      {entry.source}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}