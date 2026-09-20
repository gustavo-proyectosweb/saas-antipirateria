import Link from 'next/link'
import { createClient } from '@/lib/supabase/server' // Ajustá la ruta si tu helper está en @/lib/supabase/server

export const revalidate = 0 // Fuerza a que la página siempre obtenga datos frescos

export default async function ProductsPage() {
  const supabase = await createClient()

  // Consulta a Supabase. RLS filtrará automáticamente los productos
  // pertenecientes únicamente al usuario autenticado.
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
          <p className="text-sm text-gray-500">
            Gestioná tus productos y sus archivos PDF Máster.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {!products || products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-base font-medium">No se encontraron productos.</p>
            <p className="text-sm mt-1">
              Los productos vinculados a tu cuenta aparecerán acá.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
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
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const hasMaster = Boolean(product.master_file_key)
                  const formattedDate = new Date(
                    product.created_at
                  ).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.platform || 'Sin especificar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4">
                        {hasMaster ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ● PDF Cargado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            ○ Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
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