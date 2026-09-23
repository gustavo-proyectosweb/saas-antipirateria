// src/app/dashboard/products/page.tsx

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, platform, created_at, master_file_key')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener productos:', error)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Productos</h1>
          <p className="text-sm text-gray-400">
            Gestioná tus productos y sus archivos PDF Máster.
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
        >
          + Nuevo Producto
        </Link>
      </div>

      <div className="bg-gray-950 rounded-lg shadow border border-gray-800 overflow-hidden">
        {!products || products.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-base font-medium">No se encontraron productos.</p>
            <p className="text-sm mt-1">
              Los productos vinculados a tu cuenta aparecerán acá.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Nombre del producto
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Plataforma
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Fecha de creación
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Estado del Máster
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold text-right">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {products.map((product) => {
                  const hasMaster = Boolean(product.master_file_key)
                  const formattedDate = new Date(product.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })

                  return (
                    <tr key={product.id} className="hover:bg-gray-900/50 transition">
                      <td className="px-6 py-4 font-medium text-white">
                        {product.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                          {product.platform || 'Sin especificar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4">
                        {hasMaster ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-500/30">
                            ● PDF Cargado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/40 text-amber-300 border border-amber-500/30">
                            ○ Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/dashboard/products/${product.id}/history`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-700 text-xs font-medium rounded-md text-gray-300 hover:bg-gray-800 transition"
                        >
                          Historial
                        </Link>
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
                        >
                          {hasMaster ? 'Gestionar PDF' : 'Subir PDF'}
                        </Link>
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