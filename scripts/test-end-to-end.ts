import { PDFDocument, rgb } from 'pdf-lib'
import { stampPdf, decodeStamp } from '../src/lib/forensics/stamp'

async function runEndToEndTest() {
  console.log('⏳ Iniciando prueba del ciclo completo de estampado y decodificación (Viernes)...')

  // 1. Crear un PDF Máster de prueba
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([500, 700])
  page.drawText('Guia Imprimible VIP - Master', {
    x: 50,
    y: 600,
    size: 22,
    color: rgb(0.1, 0.1, 0.1),
  })
  const masterBytes = await pdfDoc.save()
  const masterBuffer = Buffer.from(masterBytes)

  // 2. Datos de prueba de la compra
  const testPurchaseId = 'pur_STAMP_998877_TEST'
  const testBuyerEmail = 'cliente_vip@ejemplo.com'

  console.log('1️⃣ Estampando PDF con la función unificada stampPdf()...')
  const stampedPdfBuffer = await stampPdf(masterBuffer, testPurchaseId, testBuyerEmail)
  console.log('   ✅ PDF estampado generado con éxito.')

  // 3. Inspeccionar el PDF como lo haría la Creadora (Inspector Forense)
  console.log('2️⃣ Decodificando el PDF con decodeStamp()...')
  const decodedData = await decodeStamp(stampedPdfBuffer)

  if (!decodedData) {
    throw new Error('❌ El Inspector Forense no pudo encontrar ninguna marca en el PDF.')
  }

  console.log('   ✅ Datos recuperados correctamente por el Inspector Forense:')
  console.log(`   - Purchase ID: ${decodedData.purchaseId}`)
  console.log(`   - Hash del Email del Comprador: ${decodedData.buyerEmailHash}`)
  console.log(`   - Fecha/Hora de Estampado: ${new Date(decodedData.timestamp).toLocaleString()}`)

  // 4. Validar aserción
  console.log('3️⃣ Validando coincidencia exacta...')
  if (decodedData.purchaseId === testPurchaseId) {
    console.log('\n🎉 ¡PROCESO END-TO-END COMPLETADO CON ÉXITO! La marca recuperada es 100% correcta.')
  } else {
    console.error('❌ Error: El Purchase ID recuperado no coincide con el original.')
  }
}

runEndToEndTest()