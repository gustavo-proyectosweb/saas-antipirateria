import Link from 'next/link'

export default function ProductsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Productos</h1>
        <Link
          href="/dashboard/products/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
        >
          + Nuevo Producto
        </Link>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 text-center text-gray-400">
        Producto creado exitosamente. ¡Aquí listaremos todos tus productos mañana!
      </div>
    </div>
  )
}