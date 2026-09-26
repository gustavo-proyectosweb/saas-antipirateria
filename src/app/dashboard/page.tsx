// src/app/dashboard/page.tsx

import OnboardingChecklist from '@/components/OnboardingChecklist'

export default function DashboardPage() {
  // En este punto puedes conectar estas variables con tus consultas a Supabase.
  // Por ahora las dejamos configuradas para guiar a los nuevos beta testers:
  const hasStoreConfigured = true  // Indica si la creadora ya configuró su marca/tienda
  const hasProducts = false        // Indica si ya tiene al menos 1 producto subido
  const hasPurchasesOrDownloads = false // Indica si ya realizó su primera prueba/compra

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">Bienvenida al Panel Principal</h2>

      {/* Componente visual de Onboarding para Beta Testers */}
      <OnboardingChecklist
        hasStoreConfigured={hasStoreConfigured}
        hasProducts={hasProducts}
        hasPurchasesOrDownloads={hasPurchasesOrDownloads}
      />

      <p className="text-gray-400">
        Seleccioná una opción del menú lateral para comenzar a gestionar tus productos y descargas protegidas.
      </p>
    </div>
  )
}