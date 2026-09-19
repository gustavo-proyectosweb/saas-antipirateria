import { testSupabaseConnection } from './actions'

export default function Home() {
  async function handleTest() {
    'use server'
    const res = await testSupabaseConnection()
    console.log('Resultado en servidor:', res)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-3xl font-bold mb-6">Prueba de Conexión Supabase</h1>
      <form action={handleTest}>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Probar Conexión
        </button>
      </form>
    </main>
  )
}