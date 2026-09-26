'use client'

import Link from 'next/link'

interface OnboardingChecklistProps {
  hasStoreConfigured: boolean
  hasProducts: boolean
  hasPurchasesOrDownloads: boolean
}

export default function OnboardingChecklist({
  hasStoreConfigured,
  hasProducts,
  hasPurchasesOrDownloads
}: OnboardingChecklistProps) {
  const steps = [
    {
      id: 1,
      title: 'Configura tu Tienda',
      description: 'Define el nombre de tu marca para personalizar los correos.',
      completed: hasStoreConfigured,
      href: '/dashboard/settings',
      actionText: 'Configurar marca'
    },
    {
      id: 2,
      title: 'Sube tu primer producto PDF',
      description: 'Sube el archivo original que deseas proteger con marca forense.',
      completed: hasProducts,
      href: '/dashboard/products/new',
      actionText: 'Subir producto'
    },
    {
      id: 3,
      title: 'Prueba tu primer enlace de descarga',
      description: 'Simula una entrega para comprobar la marca de agua en el PDF.',
      completed: hasPurchasesOrDownloads,
      href: '/dashboard/products',
      actionText: 'Ver productos'
    }
  ]

  const completedCount = steps.filter((s) => s.completed).length
  const progressPercentage = Math.round((completedCount / steps.length) * 100)

  // Si completó todos los pasos, no interrumpimos la vista principal
  if (completedCount === steps.length) {
    return null
  }

  return (
    <div className="bg-gray-900 border border-indigo-900/50 rounded-xl p-6 shadow-lg mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🚀 Guía de Inicio Rápido
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Completa estos 3 pasos sencillos para comenzar a proteger tu contenido digital.
          </p>
        </div>
        <span className="text-sm font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-3 py-1 rounded-full">
          {progressPercentage}% Completado
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-800 h-2 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-4 rounded-lg border transition ${
              step.completed
                ? 'bg-gray-950/40 border-gray-800 opacity-70'
                : 'bg-gray-950 border-indigo-800/40 hover:border-indigo-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                Paso {step.id}
              </span>
              {step.completed ? (
                <span className="text-emerald-400 text-xs font-semibold">✓ Completado</span>
              ) : (
                <span className="text-amber-400 text-xs font-semibold">Pendiente</span>
              )}
            </div>

            <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
            <p className="text-xs text-gray-400 mb-4">{step.description}</p>

            {!step.completed && (
              <Link
                href={step.href}
                className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                {step.actionText} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}