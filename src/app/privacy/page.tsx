import Link from 'next/link'
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      <header className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          Política de Privacidad <Lock className="w-8 h-8 text-indigo-500" />
        </h1>
        <p className="text-sm text-gray-400 mt-2">Última actualización: Septiembre 2026</p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-gray-300">
        <h2 className="text-xl font-semibold text-white">1. Protección y Hasheado de Datos</h2>
        <p>
          Respetamos profundamente la privacidad de los usuarios. Para la Red de Protección Comunitaria, no guardamos direcciones de correo electrónico en texto plano. Los datos se procesan mediante algoritmos de cifrado unidireccional <strong className="text-white">SHA-256</strong>.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">2. Red Comunitaria Anónima</h2>
        <p>
          La red agregada únicamente almacena el número total de reportes asociados a un hash criptográfico. Ningún tercero o creador puede consultar qué usuario reportó a quién ni acceder a listas de correos directos.
        </p>

        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-5 mt-6 space-y-2">
          <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> ¿Fuiste reportado injustamente?
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Garantizamos el derecho a la rectificación. Si un comprador considera que fue incluido en la lista de restricción por error o de manera maliciosa, puede solicitar una rectificación escribiendo a <strong className="text-white">soporte@tudominio.com</strong>.
          </p>
        </div>
      </section>
    </div>
  )
}