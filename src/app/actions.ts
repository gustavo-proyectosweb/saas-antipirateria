'use server'

import { createClient } from '@/lib/supabase/server'

export async function testRLS() {
  const supabase = await createClient()

  // Intentamos consultar la tabla 'products' sin estar autenticados (cliente anónimo/público)
  const { data, error } = await supabase.from('products').select('*')

  if (error) {
    console.error('❌ Error de consulta:', error.message)
    return { success: false, error: error.message }
  }

  console.log('🔒 Resultado de RLS para usuario no autenticado:', data)
  return { success: true, count: data.length, data }
}

/*'use server'

import { createClient } from '@/lib/supabase/server'

export async function testSupabaseConnection() {
  const supabase = await createClient()
  
  // Hacemos una consulta a la función interna de Supabase para verificar respuesta
  const { data, error } = await supabase.rpc('version').select()
  
  // Si no hay funciones RPC creadas, atrapamos el código de la BD
  if (error) {
    // Si la BD responde que no existe la función o tabla, igual confirma la conexión
    if (error.code === 'PGRST202' || error.code === 'PGRST204' || error.message.includes('schema cache')) {
      console.log('✅ Conexión con Supabase exitosa (La base de datos respondió correctamente)')
      return { success: true, message: 'Conexión con Supabase verificada exitosamente' }
    }
    
    console.error('❌ Error de conexión real:', error.message)
    return { success: false, error: error.message }
  }

  console.log('✅ Conexión con Supabase exitosa:', data)
  return { success: true, data }
}*/