'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reportFormSchema, type ReportFormData } from '@/lib/schemas/reportSchema'
import { ShieldAlert, Send, CheckCircle2, AlertTriangle, Link as LinkIcon, FileText, Mail, User } from 'lucide-react'
import Link from 'next/link'

export default function DenunciarPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      contentUrl: '',
      productName: '',
      description: '',
      reporterEmail: '',
    },
  })

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true)
    console.log('Datos validados en cliente:', data)

    // Simulamos temporalmente el envío (mañana conectaremos la Server Action)
    await new Promise((resolve) => setTimeout(resolve, 1200))

    setIsSubmitting(false)
    setIsSubmitted(true)
    reset()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        {/* Cabecera */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-2">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Portal Público de Denuncias
          </h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Ayúdanos a proteger el trabajo de las creadoras. Puedes reportar enlaces de descarga no autorizados o piratería de forma totalmente anónima.
          </p>
        </div>

        {/* Mensaje de Éxito */}
        {isSubmitted ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">¡Denuncia recibida!</h2>
            <p className="text-sm text-gray-300">
              Gracias por colaborar. Nuestro equipo revisará la información enviada para tomar las medidas pertinentes.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Enviar otra denuncia
            </button>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Campo 1: URL del contenido pirata */}
            <div>
              <label htmlFor="contentUrl" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-400" />
                Enlace del contenido pirata <span className="text-red-400">*</span>
              </label>
              <input
                id="contentUrl"
                type="text"
                placeholder="https://mega.nz/file/... o https://drive.google.com/..."
                {...register('contentUrl')}
                className={`w-full bg-gray-950 border ${
                  errors.contentUrl ? 'border-red-500 focus:ring-red-500' : 'border-gray-800 focus:ring-indigo-500'
                } rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.contentUrl && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.contentUrl.message}
                </p>
              )}
            </div>

            {/* Campo 2: Nombre del Producto o Creadora */}
            <div>
              <label htmlFor="productName" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Nombre del producto o Creadora <span className="text-red-400">*</span>
              </label>
              <input
                id="productName"
                type="text"
                placeholder="Ej: Curso de Fotografía o @nombre_creadora"
                {...register('productName')}
                className={`w-full bg-gray-950 border ${
                  errors.productName ? 'border-red-500 focus:ring-red-500' : 'border-gray-800 focus:ring-indigo-500'
                } rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.productName && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.productName.message}
                </p>
              )}
            </div>

            {/* Campo 3: Descripción detallada */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Detalles de la infracción <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Explica dónde encontraste el enlace o cómo se está distribuyendo el contenido no autorizado..."
                {...register('description')}
                className={`w-full bg-gray-950 border ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-800 focus:ring-indigo-500'
                } rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none`}
              />
              {errors.description && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.description.message}
                </p>
              )}
            </div>

            {/* Campo 4: Email de contacto (Opcional) */}
            <div>
              <label htmlFor="reporterEmail" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Tu correo electrónico <span className="text-gray-500 font-normal">(Opcional)</span>
              </label>
              <input
                id="reporterEmail"
                type="email"
                placeholder="tuemail@ejemplo.com (solo si deseas que te contactemos)"
                {...register('reporterEmail')}
                className={`w-full bg-gray-950 border ${
                  errors.reporterEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-800 focus:ring-indigo-500'
                } rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.reporterEmail && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.reporterEmail.message}
                </p>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-800 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Enviando denuncia...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Registrar Denuncia
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer legal breve */}
        <div className="text-center text-xs text-gray-500">
          Al enviar esta denuncia aceptas nuestros{' '}
          <Link href="/terms" className="text-indigo-400 hover:underline">
            Términos
          </Link>{' '}
          y{' '}
          <Link href="/privacy" className="text-indigo-400 hover:underline">
            Política de Privacidad
          </Link>
          .
        </div>
      </div>
    </div>
  )
}