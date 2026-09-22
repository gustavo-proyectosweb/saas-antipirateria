// src/app/dashboard/products/[id]/history/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
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

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductHistoryPage({ params }: PageProps) {
  const { id: productId } = await params
  const supabase = getSupabaseAdmin()

  // 1. Obtener información básica del producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    notFound()
  }

  // 2. Obtener historial de compras y tokens de acceso
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select(`
      id,
      buyer_email,
      created_at,
      access_tokens (
        id,
        download_count,
        expires_at,
        created_at
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (purchasesError) {
    console.error('Error al cargar historial de compras:', purchasesError)
  }

  const purchaseList = purchases || []

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Encabezado y Navegación */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <Link
            href="/dashboard/products"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Volver a productos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Historial de Descargas
          </h1>
          <p className="text-sm text-gray-600">
            Producto: <span className="font-semibold text-gray-800">{product.name}</span>
          </p>
        </div>
      </div>

      {/* Tabla de Historial */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {purchaseList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se registraron compras ni descargas para este producto aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comprador
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Compra
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descargas Usadas
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseList.map((purchase) => {
                  const token = Array.isArray(purchase.access_tokens)
                    ? purchase.access_tokens[0]
                    : purchase.access_tokens

                  const downloadsCount = token?.download_count ?? 0
                  const isBlocked = downloadsCount >= 5

                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                      {/* Email Enmascarado */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {maskEmail(purchase.buyer_email)}
                      </td>

                      {/* Fecha de Compra */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(purchase.created_at)}
                      </td>

                      {/* Contador de Descargas */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-700">
                        {downloadsCount} / 5
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isBlocked ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Agotado (5/5)
                          </span>
                        ) : downloadsCount > 0 ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pendiente
                          </span>
                        )}
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