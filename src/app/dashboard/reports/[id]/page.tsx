import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReportStatusActions from './ReportStatusActions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Buscar el reporte
  const { data: report } = await supabase
    .from('community_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (!report) {
    notFound()
  }

  // Buscar la compra con el cliente Admin
  let purchase = null
  if (report.reporter_email) {
    const { data: p } = await adminSupabase
      .from('purchases')
      .select('*')
      .eq('buyer_email', report.reporter_email)
      .limit(1)
      .maybeSingle()
    purchase = p
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link
        href="/dashboard/reports"
        className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
      >
        ← Volver a todos los reportes
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-start border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{report.product_name || 'Reporte Anónimo'}</h1>
            <p className="text-xs text-gray-400 mt-1">ID: {report.id}</p>
          </div>
          <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-gray-800 text-gray-300 border border-gray-700">
            {report.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold">Enlace Reportado</span>
            <p className="text-blue-400 break-all">
              <a href={report.content_url} target="_blank" rel="noreferrer" className="underline">
                {report.content_url}
              </a>
            </p>
          </div>

          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold">Infractor / Comprador</span>
            <p className="text-white">{report.reporter_email || 'No identificado'}</p>
          </div>
        </div>

        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-1">
          <span className="text-xs text-gray-500 uppercase font-semibold">Detalles de la Denuncia</span>
          <p className="text-gray-300 whitespace-pre-line">{report.description || 'Sin descripción adicional.'}</p>
        </div>

        <ReportStatusActions
          reportId={report.id}
          currentStatus={report.status}
          purchaseId={purchase?.id}
          isBlocked={purchase?.is_blocked}
        />
      </div>
    </div>
  )
}