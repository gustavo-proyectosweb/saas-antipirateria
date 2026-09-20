import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyAuthTrigger() {
  console.log('⏳ Probando registro de usuario y ejecución del Trigger...')

  // Usamos un formato de email válido con un timestamp único
  const testEmail = `creadora_${Date.now()}@gmail.com`
  const testPassword = 'PasswordSeguro123!'
  const testName = 'Mi Tienda Imprimible'

  try {
    // 1. Registrar usuario en Supabase Auth
    console.log(`1️⃣ Registrando usuario de prueba: ${testEmail}...`)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { name: testName },
      },
    })

    if (authError || !authData.user) {
      throw new Error(`Error al crear usuario en Auth: ${authError?.message}`)
    }

    const userId = authData.user.id
    console.log(`   ✅ Usuario registrado en auth.users con ID: ${userId}`)

    // 2. Verificar que el Trigger haya insertado la fila en la tabla creators
    console.log('2️⃣ Buscando fila creada automáticamente en public.creators...')
    
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { data: creatorData, error: creatorError } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (creatorError || !creatorData) {
      throw new Error(`❌ El trigger falló: no se encontró la fila en creators (${creatorError?.message})`)
    }

    console.log('   ✅ ¡Fila en creators encontrada exitosamente!')
    console.log(`   - ID Creadora (PK): ${creatorData.id}`)
    console.log(`   - User ID (FK): ${creatorData.user_id}`)
    console.log(`   - Nombre de Tienda: ${creatorData.store_name}`)
    console.log(`   - Plan: ${creatorData.plan}`)

    // 3. Validar coincidencia de IDs
    if (creatorData.user_id === userId) {
      console.log('\n🎉 ¡VERIFICACIÓN DE LUNES COMPLETADA CON ÉXITO! El trigger funciona al 100%.')
    } else {
      console.error('❌ El user_id no coincide.')
    }
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
  }
}

verifyAuthTrigger()