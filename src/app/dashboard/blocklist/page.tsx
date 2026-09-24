'use client'

import { useEffect, useState } from 'react'
import { getBlocklistEntries, getCommunityOptInStatus, toggleCommunityOptIn } from './actions'
import { ShieldX, Lock, Users, Radio } from 'lucide-react'

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
  const [optIn, setOptIn] = useState(false)
  const [updatingOptIn, setUpdatingOptIn] = useState(false)

  // Nota: En producción, este ID se recupera de la sesión del usuario autenticado.
  // Usamos el ID de la creadora actual para las pruebas.
  const currentCreatorId = 'e89dacd4-a090-436c-bc00-4bf6cabdcc41' 

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [blockRes, optInRes] = await Promise.all([
      getBlocklistEntries(),
      getCommunityOptInStatus(currentCreatorId)
    ])

    if (blockRes.success) setEntries(blockRes.entries)
    if (optInRes.success) setOptIn(optInRes.optIn)

    setLoading(false)
  }

  const handleToggleOptIn = async () => {
    setUpdatingOptIn(true)
    const newStatus = !optIn
    const res = await toggleCommunityOptIn(currentCreatorId, newStatus)
    if (res.success) {
      setOptIn(newStatus)
    }
    setUpdatingOptIn(false)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Lista Negra de Compradores <ShieldX className="w-6 h-6 text-red-500" />
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Histórico de usuarios bloqueados. Los correos están hasheados mediante criptografía SHA-256 para preservar la privacidad.
        </p>
      </div>

      {/* TARJETA DE CONFIGURACIÓN: RED DE DENUNCIAS COMUNITARIA (OPT-IN) */}
      <div className="border border-indigo-500/30 bg-indigo-950/20 rounded-xl p-6 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
            <Users className="w-5 h-5" />
            <span>Participar en la Red de Denuncias Comunitaria</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
              Anónimo & Opt-in
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
            Al activar esta opción, los hashes de los usuarios que agregues a tu lista negra sumarán a una base de datos comunitaria agregada. 
            <strong className="text-white"> Tu identidad y tus ventas nunca se comparten.</strong> Solo se registrará el número total de creadoras que han reportado al mismo comprador.
          </p>
        </div>

        {/* Switch Toggle */}
        <button
          onClick={handleToggleOptIn}
          disabled={updatingOptIn}
          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            optIn ? 'bg-indigo-600' : 'bg-gray-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              optIn ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
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