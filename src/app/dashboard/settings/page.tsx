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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Configuración de Integración</h1>
        <p className="text-sm text-gray-400">
          Configurá las credenciales de tu tienda para validar y procesar tus ventas automáticamente.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-900/40 border border-green-500/30 text-green-200'
              : 'bg-red-900/40 border border-red-500/30 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-lg">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Plataforma</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as 'shopify' | 'tiendanube')}
            className="w-full p-2.5 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="shopify">Shopify</option>
            <option value="tiendanube">Tiendanube</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {platform === 'shopify' ? 'Dominio myshopify.com' : 'ID o URL de la tienda'}
          </label>
          <input
            type="text"
            name="externalStoreId"
            value={externalStoreId}
            onChange={(e) => setExternalStoreId(e.target.value)}
            placeholder={platform === 'shopify' ? 'mi-tienda.myshopify.com' : '123456'}
            className="w-full p-2.5 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Webhook Secret (Firma HMAC)</label>
          <input
            type="password"
            name="webhookSecret"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="Pegá aquí el secret otorgado por la plataforma"
            required
            className="w-full p-2.5 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta clave se utiliza exclusivamente para verificar la autenticidad de las notificaciones de ventas.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  )
}