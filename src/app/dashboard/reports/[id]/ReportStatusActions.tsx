'use client'

import { useState } from 'react'
import { updateReportStatus, blockBuyerFromReport } from '../actions'

interface Props {
  reportId: string
  currentStatus: string
  purchaseId?: string | null
  isBlocked?: boolean
}

export default function ReportStatusActions({
  reportId,
  currentStatus,
  purchaseId,
  isBlocked = false,
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    await updateReportStatus(reportId, newStatus)
    setLoading(false)
  }

  const handleBlockBuyer = async () => {
    if (!purchaseId) return
    if (!confirm('¿Estás segura de agregar a este comprador a la lista negra?')) return

    setLoading(true)
    await blockBuyerFromReport(purchaseId, reportId)
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center pt-4 border-t border-gray-800">
      <span className="text-sm text-gray-400 font-medium mr-2">Cambiar estado:</span>

      <button
        disabled={loading || currentStatus === 'reviewed'}
        onClick={() => handleStatusChange('reviewed')}
        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 border border-blue-500/30 transition"
      >
        Marca como Revisado
      </button>

      <button
        disabled={loading || currentStatus === 'action_taken'}
        onClick={() => handleStatusChange('action_taken')}
        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50 border border-emerald-500/30 transition"
      >
        Acción Tomada
      </button>

      <button
        disabled={loading || currentStatus === 'discarded'}
        onClick={() => handleStatusChange('discarded')}
        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 transition"
      >
        Descartar
      </button>

      {purchaseId && (
        <button
          disabled={loading || isBlocked}
          onClick={handleBlockBuyer}
          className="ml-auto px-4 py-1.5 text-xs font-bold rounded-md bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-800 disabled:text-gray-500 transition flex items-center gap-2"
        >
          {isBlocked ? '⛔ En Lista Negra' : '🚫 Agregar a Lista Negra'}
        </button>
      )}
    </div>
  )
}