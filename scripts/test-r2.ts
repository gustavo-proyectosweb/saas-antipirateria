import * as dotenv from 'dotenv'

// Cargar variables de entorno ANTES de importar los módulos del proyecto
dotenv.config({ path: '.env.local' })

import { uploadFile, getFileBuffer, getSignedDownloadUrl } from '../src/lib/storage/r2'

async function verifyR2Module() {
  console.log('⏳ Probando módulo R2 (subida, descarga y verificación de integridad)...')

  const testKey = 'test/verificacion-martes.txt'
  const originalText = 'Contenido de prueba para verificación byte a byte en Cloudflare R2.'
  const originalBuffer = Buffer.from(originalText, 'utf-8')

  try {
    // 1. Subir Buffer
    console.log('1️⃣ Subiendo archivo de prueba...')
    await uploadFile(testKey, originalBuffer, 'text/plain')
    console.log('   ✅ Archivo subido correctamente.')

    // 2. Descargar Buffer
    console.log('2️⃣ Descargando archivo desde R2...')
    const downloadedBuffer = await getFileBuffer(testKey)
    console.log('   ✅ Archivo descargado.')

    // 3. Comparar integridad byte a byte
    console.log('3️⃣ Verificando coincidencia exacta (byte a byte)...')
    const isIdentical = originalBuffer.equals(downloadedBuffer)

    if (!isIdentical) {
      throw new Error('❌ El contenido descargado no coincide con el original.')
    }
    console.log('   ✅ ¡Coincidencia byte a byte confirmada!')

    // 4. Probar generación de URL firmada
    console.log('4️⃣ Generando URL de descarga temporal...')
    const signedUrl = await getSignedDownloadUrl(testKey, 60)
    console.log('   ✅ URL Firmada creada con éxito:')
    console.log(`   🔗 ${signedUrl.substring(0, 80)}...`)

    console.log('\n🎉 ¡Verificación del Martes completada exitosamente!')
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  }
}

verifyR2Module()