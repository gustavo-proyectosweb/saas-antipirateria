// src/app/dashboard/products/[id]/history/page.tsx

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { maskEmail, formatDate } from '@/lib/utils'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductHistoryPage({ params }: PageProps) {
  const { id: productId } = await params
  const supabase = await createClient()

  // 1. Obtener información básica del producto (RLS asegura que pertenezca a la creadora)
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
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <Link
            href="/dashboard/products"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Volver a productos
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">
            Historial de Descargas
          </h1>
          <p className="text-sm text-gray-400">
            Producto: <span className="font-semibold text-gray-200">{product.name}</span>
          </p>
        </div>
      </div>

      <div className="bg-gray-950 shadow rounded-lg overflow-hidden border border-gray-800">
        {purchaseList.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No se registraron compras ni descargas para este producto aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Comprador
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha de Compra
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Descargas Usadas
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-950 divide-y divide-gray-800 text-gray-300">
                {purchaseList.map((purchase) => {
                  const token = Array.isArray(purchase.access_tokens)
                    ? purchase.access_tokens[0]
                    : purchase.access_tokens

                  const downloadsCount = token?.download_count ?? 0
                  const isBlocked = downloadsCount >= 5

                  return (
                    <tr key={purchase.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {maskEmail(purchase.buyer_email)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(purchase.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-300">
                        {downloadsCount} / 5
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isBlocked ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-900/40 text-red-300 border border-red-500/30">
                            Agotado (5/5)
                          </span>
                        ) : downloadsCount > 0 ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-900/40 text-green-300 border border-green-500/30">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-900/40 text-yellow-300 border border-yellow-500/30">
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