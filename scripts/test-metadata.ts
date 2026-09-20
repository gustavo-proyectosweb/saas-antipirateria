import { PDFDocument, rgb } from 'pdf-lib'
import {
  injectForensicMetadata,
  extractForensicMetadata,
  ForensicPayload,
} from '../src/lib/forensics/metadata'

async function runMetadataTest() {
  console.log('⏳ Iniciando prueba de inyección de metadatos forenses en PDF...')

  // 1. Crear un PDF básico de prueba en memoria
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 400])
  page.drawText('Documento Imprimible de Prueba', {
    x: 50,
    y: 300,
    size: 20,
    color: rgb(0, 0, 0),
  })
  const originalBytes = await pdfDoc.save()
  const originalBuffer = Buffer.from(originalBytes)

  // 2. Definir payload de la compra
  const testPayload: ForensicPayload = {
    purchaseId: 'pur_987654321_test',
    buyerEmail: 'creadora_compradora@ejemplo.com',
  }

  console.log('1️⃣ Datos originales de la compra:')
  console.log(`   - Purchase ID: ${testPayload.purchaseId}`)
  console.log(`   - Email Compradora: ${testPayload.buyerEmail}`)

  // 3. Inyectar metadatos
  console.log('2️⃣ Inyectando metadatos forenses (codificados en Base64)...')
  const stampedPdfBuffer = await injectForensicMetadata(originalBuffer, testPayload)
  console.log('   ✅ Metadatos inyectados correctamente.')

  // 4. Extraer y verificar
  console.log('3️⃣ Intentando extraer e inspeccionar la marca del PDF modificado...')
  const extractedData = await extractForensicMetadata(stampedPdfBuffer)

  if (!extractedData) {
    throw new Error('❌ No se pudo extraer la marca forense del PDF.')
  }

  console.log('   ✅ Marca forense extraída con éxito:')
  console.log(`   - Purchase ID Recuperado: ${extractedData.pid}`)
  console.log(`   - Hash de Email Recuperado: ${extractedData.eh}`)
  console.log(`   - Fecha de estampado (Timestamp): ${new Date(extractedData.ts).toLocaleString()}`)

  // 5. Validar coincidencia
  if (extractedData.pid === testPayload.purchaseId) {
    console.log('\n🎉 ¡Verificación del Miércoles completada exitosamente!')
  } else {
    console.error('❌ El ID extraído no coincide con el enviado.')
  }
}

runMetadataTest()