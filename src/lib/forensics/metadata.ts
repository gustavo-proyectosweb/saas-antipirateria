// src/lib/forensics/metadata.ts
import { PDFDocument, rgb } from 'pdf-lib'
import * as crypto from 'crypto'

export interface ForensicPayload {
  purchaseId: string
  buyerEmail: string
}

function hashEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex')
    .substring(0, 16)
}

export function encodePayload(payload: ForensicPayload): string {
  const emailHash = hashEmail(payload.buyerEmail)
  const rawData = JSON.stringify({
    pid: payload.purchaseId,
    eh: emailHash,
    ts: Date.now(),
  })
  return Buffer.from(rawData, 'utf-8').toString('base64')
}

export function decodePayload(encoded: string): { pid: string; eh: string; ts: number } | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Convierte el purchaseId en una coordenada (X, Y) determinística dentro de la página.
 */
function getDeterministicPosition(purchaseId: string, width: number, height: number) {
  const hash = crypto.createHash('sha256').update(purchaseId).digest('hex')
  
  const offsetX = (parseInt(hash.substring(0, 4), 16) % 90) + 10
  const offsetY = (parseInt(hash.substring(4, 8), 16) % 90) + 10

  const x = width * (offsetX / 100)
  const y = height * (offsetY / 100)

  return { x, y }
}

/**
 * Inyecta metadatos forenses en la estructura del PDF (Capa 1)
 */
export async function injectForensicMetadata(
  pdfBuffer: Buffer,
  payload: ForensicPayload
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const encodedPayload = encodePayload(payload)
  const forensicTag = `WM-R2-${encodedPayload}`

  const existingKeywords = pdfDoc.getKeywords() || ''
  const updatedKeywords = existingKeywords
    ? `${existingKeywords}; ${forensicTag}`
    : forensicTag

  pdfDoc.setSubject(`Protected Document [ID: ${payload.purchaseId.substring(0, 8)}]`)
  pdfDoc.setKeywords([updatedKeywords])
  pdfDoc.setProducer(`PrintablesVault Forensics (${forensicTag})`)

  const modifiedPdfBytes = await pdfDoc.save()
  return Buffer.from(modifiedPdfBytes)
}

/**
 * Inyecta la marca de agua vectorial submilimétrica e imperceptible (Capa 2)
 */
export async function injectVectorForensicMark(
  pdfBuffer: Buffer,
  purchaseId: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const pages = pdfDoc.getPages()

  if (pages.length === 0) {
    throw new Error('El PDF no contiene páginas')
  }

  const firstPage = pages[0]
  const { width, height } = firstPage.getSize()

  const { x, y } = getDeterministicPosition(purchaseId, width, height)

  firstPage.drawCircle({
    x,
    y,
    size: 0.2,
    color: rgb(0, 0, 0),
    opacity: 0.01,
  })

  const modifiedBytes = await pdfDoc.save()
  return Buffer.from(modifiedBytes)
}

/**
 * Función principal que aplica AMBAS capas de seguridad (Metadatos + Vectorial)
 */
export async function applyFullForensicProtection(
  pdfBuffer: Buffer,
  payload: ForensicPayload
): Promise<Buffer> {
  const pdfWithMetadata = await injectForensicMetadata(pdfBuffer, payload)
  const finalPdf = await injectVectorForensicMark(pdfWithMetadata, payload.purchaseId)
  return finalPdf
}

export async function extractForensicMetadata(
  pdfBuffer: Buffer
): Promise<{ pid: string; eh: string; ts: number } | null> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const producer = pdfDoc.getProducer() || ''
    const keywords = pdfDoc.getKeywords() || ''

    const match =
      producer.match(/WM-R2-([A-Za-z0-9+/=]+)/) ||
      keywords.match(/WM-R2-([A-Za-z0-9+/=]+)/)

    if (!match || !match[1]) {
      return null
    }

    return decodePayload(match[1])
  } catch {
    return null
  }
}