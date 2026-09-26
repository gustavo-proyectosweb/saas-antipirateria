import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente anónimo público (sin autenticar)
const anonClient = createClient(supabaseUrl, supabaseAnonKey)

async function runSecurityAudit() {
  console.log('🔒 --- INICIANDO AUDITORÍA DE SEGURIDAD RLS --- 🔒\n')

  // 1. Intento de lectura anónima de compras (Debe fallar o retornar array vacío)
  console.log('1. Intentando leer la tabla "purchases" como usuario Anónimo...')
  const { data: purchases, error: purchasesError } = await anonClient
    .from('purchases')
    .select('*')

  if (purchasesError) {
    console.log('   ✅ BLOQUEADO POR RLS (Error esperado):', purchasesError.message)
  } else if (purchases && purchases.length === 0) {
    console.log('   ✅ BLOQUEADO POR RLS: Se retornaron 0 registros.')
  } else {
    console.error('   ❌ FALLA DE SEGURIDAD: Usuario anónimo leyó compras:', purchases)
  }

  // 2. Intento de actualización anónima en compras (Debe fallar)
  console.log('\n2. Intentando modificar "is_blocked" en "purchases" como usuario Anónimo...')
  const { data: updatedPurchase, error: updateError } = await anonClient
    .from('purchases')
    .update({ is_blocked: true })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select()

  if (updateError || !updatedPurchase || updatedPurchase.length === 0) {
    console.log('   ✅ BLOQUEADO POR RLS: No se permitió modificar compras.')
  } else {
    console.error('   ❌ FALLA DE SEGURIDAD: Se modificaron compras de forma anónima!')
  }

  // 3. Intento de lectura anónima de reportes (Debe retornar 0 registros)
  console.log('\n3. Intentando leer "community_reports" como usuario Anónimo...')
  const { data: reports, error: reportsError } = await anonClient
    .from('community_reports')
    .select('*')

  if (reportsError) {
    console.log('   ✅ BLOQUEADO POR RLS (Error esperado):', reportsError.message)
  } else if (reports && reports.length === 0) {
    console.log('   ✅ BLOQUEADO POR RLS: Se retornaron 0 registros.')
  } else {
    console.error('   ❌ FALLA DE SEGURIDAD: Usuario anónimo leyó reportes:', reports)
  }

  console.log('\n🏁 --- AUDITORÍA FINALIZADA --- 🏁')
}

runSecurityAudit()