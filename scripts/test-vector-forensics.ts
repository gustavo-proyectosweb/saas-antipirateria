import { PDFDocument, rgb } from 'pdf-lib'
import {
  applyFullForensicProtection,
  ForensicPayload,
} from '../src/lib/forensics/metadata'

async function runVectorTest() {
  console.log('⏳ Iniciando prueba de micro-variación vectorial y marcas forenses...')

  // 1. Generar un PDF Máster en memoria
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 400])
  page.drawText('Documento Master - PrintablesVault', {
    x: 50,
    y: 350,
    size: 18,
    color: rgb(0, 0, 0),
  })
  const masterBytes = await pdfDoc.save()
  const masterBuffer = Buffer.from(masterBytes)

  // 2. Definir 2 compras distintas para el mismo producto
  const purchaseA: ForensicPayload = {
    purchaseId: 'pur_COMPRA_A_111111',
    buyerEmail: 'compradora_a@ejemplo.com',
  }

  const purchaseB: ForensicPayload = {
    purchaseId: 'pur_COMPRA_B_999999',
    buyerEmail: 'compradora_b@ejemplo.com',
  }

  // 3. Estampar ambas copias
  console.log('1️⃣ Generando PDF con marca forense para Compra A...')
  const pdfA = await applyFullForensicProtection(masterBuffer, purchaseA)

  console.log('2️⃣ Generando PDF con marca forense para Compra B...')
  const pdfB = await applyFullForensicProtection(masterBuffer, purchaseB)

  // 4. Comparar diferencias de bytes
  console.log('3️⃣ Verificando diferenciación de archivos...')

  const isMasterVsAEqual = masterBuffer.equals(pdfA)
  const isMasterVsBEqual = masterBuffer.equals(pdfB)
  const isAVsBEqual = pdfA.equals(pdfB)

  console.log(`   - ¿El Máster es idéntico a la Compra A?: ${isMasterVsAEqual ? '❌ SI' : '✅ NO'}`)
  console.log(`   - ¿El Máster es idéntico a la Compra B?: ${isMasterVsBEqual ? '❌ SI' : '✅ NO'}`)
  console.log(`   - ¿La Compra A es idéntica a la Compra B?: ${isAVsBEqual ? '❌ SI' : '✅ NO'}`)

  if (!isMasterVsAEqual && !isMasterVsBEqual && !isAVsBEqual) {
    console.log('\n🎉 ¡Verificación del Jueves completada exitosamente! Todas las copias son únicas.')
  } else {
    console.error('❌ Error: Las estampas generaron archivos idénticos.')
  }
}

runVectorTest()