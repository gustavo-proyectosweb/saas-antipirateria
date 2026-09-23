// src/app/(dashboard)/layout.tsx

import Link from 'next/link'
import { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar / Navegación Lateral */}
      <aside className="w-64 bg-gray-950 p-6 border-r border-gray-800 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-bold tracking-wider text-indigo-400">
              ANTIPIRATERÍA
            </h1>
            <p className="text-xs text-gray-400">Panel de Creadora</p>
          </div>

          <nav className="space-y-2">
            <Link
              href="/dashboard/products"
              className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition"
            >
              📦 Productos
            </Link>
            <Link
              href="/dashboard/failures"
              className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition"
            >
              ⚠️ Fallos de Entrega
            </Link>
            <Link
              href="/dashboard/settings"
              className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition"
            >
              ⚙️ Configuración
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-800 text-xs text-gray-500">
          SaaS Antipiratería © {new Date().getFullYear()}
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}