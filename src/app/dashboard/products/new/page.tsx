// src/app/dashboard/products/new/page.tsx

'use client'

import { useActionState } from 'react'
import { createProduct, FormState } from '../actions'
import Link from 'next/link'

const initialState: FormState = {
  message: '',
  errors: {},
}

export default function NewProductPage() {
  const [state, formAction, isPending] = useActionState(createProduct, initialState)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Crear Nuevo Producto</h1>
        <Link
          href="/dashboard/products"
          className="text-sm text-gray-400 hover:text-white transition"
        >
          ← Volver a productos
        </Link>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-800 pb-2">
          1. Datos Básicos del Producto
        </h2>

        {state?.message && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-sm">
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre del Producto / Imprimible
            </label>
            <input
              type="text"
              name="name"
              placeholder="Ej: Agenda Imprimible 2026 - Flores"
              required
              disabled={isPending}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-red-400">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Plataforma de Venta
            </label>
            <select
              name="platform"
              required
              defaultValue="tiendanube"
              disabled={isPending}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="tiendanube">Tiendanube</option>
              <option value="shopify">Shopify</option>
            </select>
            {state?.errors?.platform && (
              <p className="mt-1 text-xs text-red-400">{state.errors.platform[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              ID Externo del Producto
            </label>
            <input
              type="text"
              name="externalId"
              placeholder="Ej: 12345678"
              required
              disabled={isPending}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Identificador numérico o alfanumérico en Tiendanube o Shopify.
            </p>
            {state?.errors?.externalId && (
              <p className="mt-1 text-xs text-red-400">{state.errors.externalId[0]}</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-800 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}