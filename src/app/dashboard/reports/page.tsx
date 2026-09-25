import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExternalLink, ShieldAlert, FileText } from 'lucide-react'

export default async function DashboardReportsPage() {
  const supabase = await createClient()

  // 1. Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Obtener la creadora vinculada al usuario
  const { data: creator } = await supabase
    .from('creators')
    .select('id, store_name')
    .eq('user_id', user.id)
    .single()

  if (!creator) {
    return (
      <div className="p-8 text-gray-300">
        <h1 className="text-2xl font-bold mb-4">Portal de Reportes</h1>
        <p>No se encontró un perfil de creadora vinculado a tu cuenta.</p>
      </div>
    )
  }

  // 3. Consultar reportes vinculados a esta creadora
  const { data: reports } = await supabase
    .from('community_reports')
    .select('*')
    .eq('matched_creator_id', creator.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto text-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" />
            Reportes de Piratería Detectados
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Lista de denuncias públicas vinculadas a la tienda <span className="text-indigo-400 font-semibold">{creator.store_name}</span>.
          </p>
        </div>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-300">Sin reportes registrados</h3>
          <p className="text-sm text-gray-500 mt-1">
            No se han recibido denuncias relacionadas a tus productos por el momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">
                    {report.status || 'Pendiente'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(report.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-100">{report.product_name}</h3>
                <p className="text-sm text-gray-400">{report.description}</p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-center">
                <a
                  href={report.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                >
                  Ver Enlace Pirata
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}