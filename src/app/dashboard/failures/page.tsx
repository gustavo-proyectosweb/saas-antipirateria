// src/app/dashboard/failures/page.tsx
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { maskEmail, formatDate } from '@/lib/utils'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno para Supabase Admin')
  }

  return createClient(url, key)
}

export const dynamic = 'force-dynamic'

/**
 * Convierte los códigos de causa técnicos a etiquetas claras para la creadora.
 */
function getFriendlyReason(reason: string): { label: string; description: string } {
  switch (reason) {
    case 'MISSING_MASTER_FILE':
      return {
        label: 'Falta archivo PDF máster',
        description: 'El producto no tiene un archivo asignado en el sistema.'
      }
    case 'EMAIL_SEND_FAILED':
      return {
        label: 'Error al enviar email',
        description: 'No se pudo entregar el correo con el enlace de descarga.'
      }
    case 'TOKEN_GENERATION_FAILED':
      return {
        label: 'Error de token',
        description: 'Fallo al generar el enlace único de seguridad.'
      }
    default:
      return {
        label: 'Requiere atención',
        description: 'Ocurrió un inconveniente no especificado en la entrega.'
      }
  }
}

export default async function FailuresDashboardPage() {
  const supabase = getSupabaseAdmin()

  // Consultar fallos de entrega ordenados del más reciente al más antiguo
  const { data: failures, error } = await supabase
    .from('delivery_failures')
    .select(`
      id,
      buyer_email,
      reason,
      status,
      error_details,
      created_at,
      products (
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
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <Link href="/dashboard/products" className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Gestión de Fallos de Entrega
          </h1>
          <p className="text-sm text-gray-600">
            Revisión y reintento de entregas que requirieron atención manual.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {failureList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            🎉 ¡Excelente! No hay registros de entregas fallidas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Comprador
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Causa
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {failureList.map((item) => {
                  const productName = (item.products as any)?.name || 'Sin asignar'
                  const friendlyReason = getFriendlyReason(item.reason)

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {maskEmail(item.buyer_email)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="font-semibold text-red-600 block">
                          {friendlyReason.label}
                        </span>
                        <span className="text-xs text-gray-500 block max-w-xs">
                          {friendlyReason.description}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'resolved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
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