'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Turnstile } from '@marsidev/react-turnstile'
import { reportFormSchema, type ReportFormData } from '@/lib/schemas/reportSchema'
import { submitPublicReport } from './actions'
import { ShieldAlert, Send, CheckCircle2, AlertTriangle, Link as LinkIcon, FileText, Mail, User, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function DenunciarPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  
  // Estado para el token del Captcha Turnstile
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  
  // Estado para el campo Honeypot (campo oculto anti-bots)
  const [honeypot, setHoneypot] = useState<string>('')

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

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
  setServerError(null)

  if (!turnstileToken) {
    setServerError('Por favor, completa la verificación de seguridad.')
    return
  }

  setIsSubmitting(true)

  try {
    const formPayload = new FormData()
    formPayload.append('contentUrl', data.contentUrl)
    formPayload.append('productName', data.productName)
    formPayload.append('description', data.description)
    if (data.reporterEmail) {
      formPayload.append('reporterEmail', data.reporterEmail)
    }

    const fileInput = document.getElementById('evidenceFile') as HTMLInputElement | null
    if (fileInput?.files?.[0]) {
      formPayload.append('evidenceFile', fileInput.files[0])
    }

    const res = await submitPublicReport(formPayload, turnstileToken, honeypot)

    if (res.success) {
      setIsSubmitted(true)
      reset()
      setTurnstileToken('')
    } else {
      setServerError(res.message)
    }
  } catch (err) {
    console.error(err)
    setServerError('Ocurrió un error inesperado al procesar la denuncia.')
  } finally {
    setIsSubmitting(false)
  }
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
            Ayúdanos a proteger el trabajo de las creadoras. Puedes reportar enlaces de descarga no autorizados de forma anónima y segura.
          </p>
        </div>

        {/* Mensaje de Éxito */}
        {isSubmitted ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">¡Denuncia recibida!</h2>
            <p className="text-sm text-gray-300">
              Gracias por colaborar. La verificación anti-spam aprobó el envío y nuestro equipo revisará la información.
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
            
            {serverError && (
              <div className="bg-red-950/50 border border-red-500/40 text-red-300 p-4 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* CAMPO HONEYPOT (Oculto visualmente para humanos) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website_hp">No llenar si eres humano</label>
              <input
                id="website_hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

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

            {/* WIDGET DE CLOUDFLARE TURNSTILE */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => {
                  setTurnstileToken(token)
                  setServerError(null)
                }}
                onError={() => {
                  setTurnstileToken('')
                  setServerError('Error al cargar la verificación anti-spam.')
                }}
                onExpire={() => {
                  setTurnstileToken('')
                }}
              />
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Protección anti-spam activada
              </span>
            </div>

            {/* Campo opcional: Adjuntar PDF filtrado */}
<div>
  <label htmlFor="evidenceFile" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
    <FileText className="w-4 h-4 text-indigo-400" />
    Archivo PDF filtrado <span className="text-gray-500 font-normal">(Opcional)</span>
  </label>
  <input
    id="evidenceFile"
    name="evidenceFile"
    type="file"
    accept=".pdf"
    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
  />
  <p className="text-[11px] text-gray-500 mt-1">
    Si adjuntas el archivo PDF original, el sistema intentará identificar automáticamente a la creadora afectada.
  </p>
</div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Validando y enviando...</span>
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