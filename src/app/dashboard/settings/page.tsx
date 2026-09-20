// src/app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { saveStoreConnection, getStoreConnection } from './actions'

export default function SettingsPage() {
  const [platform, setPlatform] = useState<'shopify' | 'tiendanube'>('shopify')
  const [externalStoreId, setExternalStoreId] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Cargar credenciales existentes al cambiar de plataforma
  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      const data = await getStoreConnection(platform)
      if (data) {
        setExternalStoreId(data.external_store_id || '')
        setWebhookSecret(data.webhook_secret || '')
      } else {
        setExternalStoreId('')
        setWebhookSecret('')
      }
      setLoading(false)
    }
    loadSettings()
  }, [platform])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('platform', platform)

    const result = await saveStoreConnection(formData)

    if (result.success) {
      setMessage({ type: 'success', text: '¡Configuración guardada correctamente!' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Ocurrió un error.' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Configuración de Integración</h1>
      <p className="text-gray-600 mb-6">
        Configura las credenciales de tu tienda para validar y procesar tus ventas automáticamente.
      </p>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {/* Selección de plataforma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plataforma</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as 'shopify' | 'tiendanube')}
            className="w-full p-2.5 border text-gray-900 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="shopify">Shopify</option>
            <option value="tiendanube">Tiendanube</option>
          </select>
        </div>

        {/* Dominio o ID de tienda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {platform === 'shopify' ? 'Dominio myshopify.com' : 'ID o URL de la tienda'}
          </label>
          <input
            type="text"
            name="externalStoreId"
            value={externalStoreId}
            onChange={(e) => setExternalStoreId(e.target.value)}
            placeholder={platform === 'shopify' ? 'mi-tienda.myshopify.com' : '123456'}
            className="w-full p-2.5 border border-gray-300 text-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret (Firma HMAC)</label>
          <input
            type="password"
            name="webhookSecret"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="Pegá aquí el secret otorgado por la plataforma"
            required
            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta clave se utiliza exclusivamente para verificar la autenticidad de las notificaciones de ventas.
          </p>
        </div>

        {/* Botón Guardar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white font-medium py-2.5 px-4 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  )
}