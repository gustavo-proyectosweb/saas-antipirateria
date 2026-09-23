// src/app/dashboard/failures/page.tsx

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { maskEmail, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function getFriendlyReason(reason: string): { label: string; description: string } {
  switch (reason) {
    case 'MISSING_MASTER_FILE':
      return {
        label: 'Falta archivo PDF máster',
        description: 'El producto no tiene un archivo asignado en el sistema.',
      }
    case 'EMAIL_SEND_FAILED':
      return {
        label: 'Error al enviar email',
        description: 'No se pudo entregar el correo con el enlace de descarga.',
      }
    case 'TOKEN_GENERATION_FAILED':
      return {
        label: 'Error de token',
        description: 'Fallo al generar el enlace único de seguridad.',
      }
    default:
      return {
        label: 'Requiere atención',
        description: 'Ocurrió un inconveniente no especificado en la entrega.',
      }
  }
}

export default async function FailuresDashboardPage() {
  const supabase = await createClient()

  const { data: failures, error } = await supabase
    .from('delivery_failures')
    .select(`
      id,
      buyer_email,
      reason,
      status,
      error_details,
      created_at,
      products!inner (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error cargando fallos de entrega:', error)
  }

  const failureList = failures || []

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <Link href="/dashboard/products" className="text-sm text-gray-400 hover:text-white transition">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">
            Gestión de Fallos de Entrega
          </h1>
          <p className="text-sm text-gray-400">
            Revisión y reintento de entregas que requirieron atención manual.
          </p>
        </div>
      </div>

      <div className="bg-gray-950 shadow rounded-lg overflow-hidden border border-gray-800">
        {failureList.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            🎉 ¡Excelente! No hay registros de entregas fallidas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Comprador
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Causa
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-950 divide-y divide-gray-800">
                {failureList.map((item) => {
                  const productObj = Array.isArray(item.products) ? item.products[0] : item.products
                  const productName = productObj?.name || 'Sin asignar'
                  const friendlyReason = getFriendlyReason(item.reason)

                  return (
                    <tr key={item.id} className="hover:bg-gray-900/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {maskEmail(item.buyer_email)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        <span className="font-semibold text-red-400 block">
                          {friendlyReason.label}
                        </span>
                        <span className="text-xs text-gray-500 block max-w-xs">
                          {friendlyReason.description}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          item.status === 'resolved'
                            ? 'bg-green-900/40 text-green-300 border-green-500/30'
                            : 'bg-red-900/40 text-red-300 border-red-500/30'
                        }`}>
                          {item.status === 'resolved' ? 'Resuelto' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}