// src/lib/forensics/stamp.ts
import {
  injectForensicMetadata,
  injectVectorForensicMark,
  extractForensicMetadata,
  ForensicPayload,
} from './metadata'

export type { ForensicPayload }

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

  const pdfWithMetadata = await injectForensicMetadata(masterBuffer, payload)
  const finalStampedBuffer = await injectVectorForensicMark(pdfWithMetadata, purchaseId)

  return finalStampedBuffer
}

/**
 * Decodifica la marca del PDF para usar en el Inspector Forense
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