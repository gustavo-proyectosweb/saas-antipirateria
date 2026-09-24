import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      <header className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          Términos de Servicio <ShieldCheck className="w-8 h-8 text-indigo-500" />
        </h1>
        <p className="text-sm text-gray-400 mt-2">Última actualización: Septiembre 2026</p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-gray-300">
        <h2 className="text-xl font-semibold text-white">1. Uso del Servicio y Descargas</h2>
        <p>
          Nuestra plataforma entrega contenido digital protegido mediante marcas forenses. El acceso a los enlaces de descarga está sujeto a la validación de integridad de la compra.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">2. Restricciones y Cancelaciones</h2>
        <p>
          Nos reservamos el derecho de revocar o restringir el acceso a descargas cuando se detecten patrones de redistribución no autorizada o reportes reiterados de infracción en la red de protección.
        </p>

        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-5 mt-6 space-y-2">
          <h3 className="text-base font-semibold text-indigo-300 flex items-center gap-2">
            <Mail className="w-5 h-5" /> Mecanismo de Disputa y Apelación
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Si crees que tu acceso ha sido restringido o bloqueado por error, puedes presentar una apelación formal enviando un correo a <strong className="text-white">soporte@tudominio.com</strong> adjuntando tu comprobante de compra e ID de orden. Revisaremos tu caso en un plazo máximo de 5 días hábiles.
          </p>
        </div>
      </section>
    </div>
  )
}