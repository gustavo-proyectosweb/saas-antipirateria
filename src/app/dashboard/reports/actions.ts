'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Cambiar el estado del reporte
export async function updateReportStatus(reportId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('community_reports')
    .update({ status })
    .eq('id', reportId)

  if (error) {
    console.error('Error al actualizar estado:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/reports')
  revalidatePath(`/dashboard/reports/${reportId}`)
  return { success: true }
}

// 2. Agregar comprador a la lista negra (bloquear compra)
export async function blockBuyerFromReport(purchaseId: string, reportId: string) {
  const adminSupabase = createAdminClient()

  // Marcar la compra como bloqueada en la DB
  const { error: purchaseError } = await adminSupabase
    .from('purchases')
    .update({ is_blocked: true })
    .eq('id', purchaseId)

  if (purchaseError) {
    console.error('Error al bloquear compra:', purchaseError)
    return { success: false, error: purchaseError.message }
  }

  // Actualizar automáticamente el reporte a "action_taken"
  await updateReportStatus(reportId, 'action_taken')

  revalidatePath('/dashboard/reports')
  revalidatePath(`/dashboard/reports/${reportId}`)
  return { success: true }
}