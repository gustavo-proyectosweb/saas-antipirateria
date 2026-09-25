import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ReportsListPage() {
  const supabase = await createClient()

  // Obtener la creadora logueada
  const { data: { user } } = await supabase.auth.getUser()
  const { data: creator } = await supabase
    .from('creators')
    .select('id, store_name')
    .eq('user_id', user?.id)
    .single()

  // Obtener los reportes de la creadora
  const { data: reports } = await supabase
    .from('community_reports')
    .select('*')
    .eq('matched_creator_id', creator?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-red-500">🛡️</span> Reportes de Piratería Detectados
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Lista de denuncias públicas vinculadas a la tienda <strong className="text-blue-400">{creator?.store_name}</strong>.
        </p>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          No hay reportes de piratería registrados hasta el momento.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-gray-700 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-red-950 text-red-400 border border-red-800">
                    {report.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{report.product_name || 'Reporte Anónimo'}</h3>
                <p className="text-sm text-gray-400 line-clamp-1">{report.description || 'Sin descripción'}</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <a
                  href={report.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                >
                  Ver Enlace Pirata ↗
                </a>
                <Link
                  href={`/dashboard/reports/${report.id}`}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
                >
                  Gestionar Reporte →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}