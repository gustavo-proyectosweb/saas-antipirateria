'use server'

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Función auxiliar para hashear el correo (SHA-256)
 */
export async function hashEmail(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase()
  return crypto.createHash('sha256').update(normalizedEmail).digest('hex')
}

/**
 * Agrega un comprador a la lista negra
 */
export async function addToBlocklist(
  email: string,
  reason: string = 'Infracción detectada en Inspector Forense',
  source: 'manual' | 'inspector' = 'inspector',
  creatorId?: string
) {
  try {
    if (!email) throw new Error('El correo electrónico es requerido.')

    const emailHash = await hashEmail(email)
    const supabase = getSupabaseAdmin()

    // Si no se pasa creatorId explícito, intentamos insertar el registro
    const { data, error } = await supabase.from('blocklist_entries').insert({
      creator_id: creatorId || null,
      buyer_email_hash: emailHash,
      reason,
      source,
    }).select()

    if (error) {
      // Si ya existía el registro bloqueado, asumimos éxito
      if (error.code === '23505') {
        return { success: true, message: 'El usuario ya estaba en la lista negra.' }
      }
      throw error
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Error al agregar a la lista negra:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Obtiene la lista de bloqueos guardados
 */
export async function getBlocklistEntries() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('blocklist_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, entries: data || [] }
  } catch (err: any) {
    console.error('Error al obtener la lista negra:', err)
    return { success: false, entries: [], error: err.message }
  }
}

/**
 * Verifica si un email está bloqueado por la creadora
 */
export async function isEmailBlocked(email: string, creatorId?: string): Promise<boolean> {
  try {
    const emailHash = await hashEmail(email)
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('blocklist_entries')
      .select('id')
      .eq('buyer_email_hash', emailHash)

    if (creatorId) {
      query = query.eq('creator_id', creatorId)
    }

    const { data, error } = await query

    if (error || !data) return false
    return data.length > 0
  } catch (err) {
    console.error('Error verificando lista negra:', err)
    return false
  }
}

/**
 * Obtiene el estado del Toggle Opt-In de la creadora actual
 */
export async function getCommunityOptInStatus(creatorId: string) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('creators')
      .select('community_opt_in')
      .eq('id', creatorId)
      .single()

    if (error) throw error
    return { success: true, optIn: data?.community_opt_in || false }
  } catch (err: any) {
    console.error('Error al obtener estado opt-in:', err)
    return { success: false, optIn: false }
  }
}

/**
 * Actualiza la preferencia Opt-In de la creadora
 */
export async function toggleCommunityOptIn(creatorId: string, status: boolean) {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('creators')
      .update({ community_opt_in: status })
      .eq('id', creatorId)

    if (error) throw error
    return { success: true, status }
  } catch (err: any) {
    console.error('Error al actualizar opt-in:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Obtiene el conteo global anónimo para un hash específico
 */
export async function getGlobalReportCount(emailHash: string): Promise<number> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('global_blocklist')
      .select('report_count')
      .eq('buyer_email_hash', emailHash)
      .single()

    if (error || !data) return 0
    return data.report_count || 0
  } catch {
    return 0
  }
}

/**
 * Constante que define el umbral mínimo de reportes comunitarios para disparar alerta
 */
const GLOBAL_WARNING_THRESHOLD = 3

/**
 * Consulta el conteo de reportes de un comprador y determina si supera el umbral
 */
export async function checkCommunityWarning(buyerEmailHash: string) {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('global_blocklist')
      .select('report_count')
      .eq('buyer_email_hash', buyerEmailHash)
      .single()

    if (error || !data) {
      return { hasWarning: false, reportCount: 0 }
    }

    const reportCount = data.report_count || 0
    const hasWarning = reportCount >= GLOBAL_WARNING_THRESHOLD

    return { hasWarning, reportCount }
  } catch (err) {
    console.error('Error al consultar advertencia comunitaria:', err)
    return { hasWarning: false, reportCount: 0 }
  }
}