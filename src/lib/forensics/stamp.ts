import {
  injectForensicMetadata,
  injectVectorForensicMark,
  extractForensicMetadata,
  ForensicPayload,
} from './metadata'

export interface StampResult {
  stampedBuffer: Buffer
  purchaseId: string
}

/**
 * Función principal end-to-end: combina metadatos + marca vectorial
 */
export async function stampPdf(
  masterBuffer: Buffer,
  purchaseId: string,
  buyerEmail: string
): Promise<Buffer> {
  const payload: ForensicPayload = {
    purchaseId,
    buyerEmail,
  }

  // 1. Inyectar metadatos forenses en estructuras internas (Capa 1)
  const pdfWithMetadata = await injectForensicMetadata(masterBuffer, payload)

  // 2. Aplicar micro-variación vectorial determinística imperceptible (Capa 2)
  const finalStampedBuffer = await injectVectorForensicMark(pdfWithMetadata, purchaseId)

  return finalStampedBuffer
}

/**
 * Decodifica la marca del PDF para usar en el Inspector Forense (Módulo C)
 */
export async function decodeStamp(
  pdfBuffer: Buffer
): Promise<{ purchaseId: string; buyerEmailHash: string; timestamp: number } | null> {
  const extractedData = await extractForensicMetadata(pdfBuffer)

  if (!extractedData) {
    return null
  }

  return {
    purchaseId: extractedData.pid,
    buyerEmailHash: extractedData.eh,
    timestamp: extractedData.ts,
  }
}