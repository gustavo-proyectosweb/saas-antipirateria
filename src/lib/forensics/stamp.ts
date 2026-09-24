// src/lib/forensics/stamp.ts
import { injectForensicMetadata, extractForensicMetadata, ForensicPayload } from './metadata'
import { PDFDocument, rgb, PDFName, PDFString, PDFDict } from 'pdf-lib'
import zlib from 'zlib'

export type { ForensicPayload }

export interface StampResult {
  stampedBuffer: Buffer
  purchaseId: string
}

/**
 * Inyecta la marca forense en múltiples capas
 */
export async function stampPdf(
  masterBuffer: Buffer,
  purchaseId: string,
  buyerEmail: string
): Promise<Buffer> {
  const payload: ForensicPayload = { purchaseId, buyerEmail }

  // 1. Inyectar metadatos estándar y XMP
  let pdfBuffer = await injectForensicMetadata(masterBuffer, payload)

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()

    if (pages.length > 0) {
      pages.forEach((page) => {
        // Capa 1: Dibujar texto fuera de vista
        page.drawText(`STAMP_PID:${purchaseId}`, {
          x: -500,
          y: -500,
          size: 1,
        })

        // Capa 2: Dibujar texto micro-vectorial en canvas
        page.drawText(`STAMP_PID:${purchaseId}`, {
          x: 5,
          y: 5,
          size: 0.5,
          color: rgb(0.99, 0.99, 0.99),
        })

        // Capa 3: Inyección en Resources/Properties
        const pageDict = page.node
        let resources = pageDict.get(PDFName.of('Resources'))
        if (!resources || !(resources instanceof PDFDict)) {
          resources = pdfDoc.context.obj({})
          pageDict.set(PDFName.of('Resources'), resources)
        }

        let properties = (resources as PDFDict).get(PDFName.of('Properties'))
        if (!properties || !(properties instanceof PDFDict)) {
          properties = pdfDoc.context.obj({})
          ;(resources as PDFDict).set(PDFName.of('Properties'), properties)
        }

        ;(properties as PDFDict).set(
          PDFName.of('STAMP_PID'),
          PDFString.of(`STAMP_PID:${purchaseId}`)
        )
      })

      // Capa 4: Catálogo Raíz
      pdfDoc.catalog.set(
        PDFName.of('STAMP_PID'),
        PDFString.of(`STAMP_PID:${purchaseId}`)
      )
    }

    const savedBytes = await pdfDoc.save()
    pdfBuffer = Buffer.from(savedBytes)
  } catch (err) {
    console.warn('[STAMP] Error al inyectar capas adicionales:', err)
  }

  return pdfBuffer
}

export interface DecodedStampResult {
  purchaseId?: string
  methodFound?: 'info_metadata' | 'xmp_metadata' | 'structural_resource' | 'zlib_stream_scan' | 'raw_buffer'
  [key: string]: any
}

/**
 * Inspector Forense a prueba de compresores como Smallpdf
 */
export async function decodeStamp(pdfBuffer: Buffer): Promise<DecodedStampResult | null> {
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

  console.log('\n=================== [INSPECTOR FORENSE] ===================')
  console.log(`[INSPECTOR] Tamaño del archivo: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })

    // --- NIVEL 1: InfoDict (Metadatos estándar) ---
    const subject = pdfDoc.getSubject() || ''
    const keywords = pdfDoc.getKeywords() || ''
    const producer = pdfDoc.getProducer() || ''
    const match1 = `${subject} ${keywords} ${producer}`.match(uuidRegex)
    
    if (match1) {
      console.log(`✅ [NIVEL 1 ÉXITO] Marca en InfoDict: ${match1[0]}`)
      return { purchaseId: match1[0], methodFound: 'info_metadata' }
    }

    // --- NIVEL 2: Metadatos XMP ---
    try {
      const extractedPayload = await extractForensicMetadata(pdfBuffer)
      if (extractedPayload) {
        const foundPid = (extractedPayload as any).pid || (extractedPayload as any).purchaseId
        if (foundPid) {
          console.log(`✅ [NIVEL 2 ÉXITO] Marca en XMP: ${foundPid}`)
          return { purchaseId: foundPid, methodFound: 'xmp_metadata' }
        }
      }
    } catch {}

    // --- NIVEL 3: Estructura de Diccionarios ---
    try {
      const catalogStamp = pdfDoc.catalog.get(PDFName.of('STAMP_PID'))
      if (catalogStamp) {
        const catalogMatch = catalogStamp.toString().match(uuidRegex)
        if (catalogMatch) {
          console.log(`✅ [NIVEL 3 ÉXITO] Marca en Catalog: ${catalogMatch[0]}`)
          return { purchaseId: catalogMatch[0], methodFound: 'structural_resource' }
        }
      }

      for (const [i, page] of pdfDoc.getPages().entries()) {
        const resources = page.node.get(PDFName.of('Resources'))
        if (resources && resources instanceof PDFDict) {
          const properties = resources.get(PDFName.of('Properties'))
          if (properties && properties instanceof PDFDict) {
            const stampProp = properties.get(PDFName.of('STAMP_PID'))
            if (stampProp) {
              const propMatch = stampProp.toString().match(uuidRegex)
              if (propMatch) {
                console.log(`✅ [NIVEL 3 ÉXITO] Marca en Resources Pág ${i + 1}: ${propMatch[0]}`)
                return { purchaseId: propMatch[0], methodFound: 'structural_resource' }
              }
            }
          }
        }
      }
    } catch {}

    // --- NIVEL 4: Escaneo Zlib Directo sobre Bloques Stream (Resistente a Smallpdf/Pdftools) ---
    console.log('[NIVEL 4] Escaneando y descomprimiendo bloques zlib del binario PDF...')
    const streamHeader = Buffer.from('stream')
    const endstreamHeader = Buffer.from('endstream')

    let pos = 0
    while ((pos = pdfBuffer.indexOf(streamHeader, pos)) !== -1) {
      // Saltar la palabra 'stream' y posibles caracteres \r\n
      let startPos = pos + streamHeader.length
      if (pdfBuffer[startPos] === 0x0d) startPos++ // \r
      if (pdfBuffer[startPos] === 0x0a) startPos++ // \n

      const endPos = pdfBuffer.indexOf(endstreamHeader, startPos)
      if (endPos !== -1) {
        const compressedData = pdfBuffer.subarray(startPos, endPos)
        
        try {
          // Descomprime el stream directamente con zlib nativo
          const decompressed = zlib.inflateSync(compressedData)
          const textContent = decompressed.toString('latin1')

          if (textContent.includes('STAMP_PID:')) {
            const matchStream = textContent.match(uuidRegex)
            if (matchStream) {
              console.log(`✅ [NIVEL 4 ÉXITO] ¡Marca recuperada mediante descompresión Zlib!: ${matchStream[0]}`)
              return { purchaseId: matchStream[0], methodFound: 'zlib_stream_scan' }
            }
          }
        } catch {
          // Si el bloque de stream no era zlib estándar (ej: imágenes o fuentes), se omite
        }
      }
      pos += streamHeader.length
    }

    // --- NIVEL 5: Buffer Crudo (Fallback por si el PDF no estaba comprimido) ---
    const rawPdfText = pdfBuffer.toString('latin1')
    const vectorIndex = rawPdfText.indexOf('STAMP_PID:')
    if (vectorIndex !== -1) {
      const vectorMatch = rawPdfText.slice(vectorIndex, vectorIndex + 80).match(uuidRegex)
      if (vectorMatch) {
        console.log(`✅ [NIVEL 5 ÉXITO] Marca en Buffer Crudo: ${vectorMatch[0]}`)
        return { purchaseId: vectorMatch[0], methodFound: 'raw_buffer' }
      }
    }

    console.log('=================== [RESULTADO: SIN MARCA] ===================\n')
    return null
  } catch (error) {
    console.error('[INSPECTOR ERROR CRÍTICO]:', error)
    return null
  }
}