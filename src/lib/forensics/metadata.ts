import { PDFDocument } from 'pdf-lib'
import * as crypto from 'crypto'

export interface ForensicPayload {
  purchaseId: string
  buyerEmail: string
}

/**
 * Genera un hash SHA-256 corto del email del comprador para no guardar el email en texto plano
 */
function hashEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex')
    .substring(0, 16) // Nos quedamos con los primeros 16 caracteres
}

/**
 * Convierte los datos de la compra a un payload codificado en Base64
 */
export function encodePayload(payload: ForensicPayload): string {
  const emailHash = hashEmail(payload.buyerEmail)
  const rawData = JSON.stringify({
    pid: payload.purchaseId,
    eh: emailHash,
    ts: Date.now(),
  })

  // Codificar a Base64 para que no sea texto plano legible a simple vista
  return Buffer.from(rawData, 'utf-8').toString('base64')
}

/**
 * Decodifica un string Base64 para recuperar el payload
 */
export function decodePayload(encoded: string): { pid: string; eh: string; ts: number } | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Inyecta los metadatos forenses invisibles en un archivo PDF
 */
export async function injectForensicMetadata(
  pdfBuffer: Buffer,
  payload: ForensicPayload
): Promise<Buffer> {
  // 1. Cargar el PDF existente
  const pdfDoc = await PDFDocument.load(pdfBuffer)

  // 2. Codificar la marca forense en Base64
  const encodedPayload = encodePayload(payload)
  const forensicTag = `WM-R2-${encodedPayload}`

  // 3. Escribir metadatos estándar (Subject y Keywords)
  // Agregamos las palabras clave sin sobrescribir información crítica visible
  const existingKeywords = pdfDoc.getKeywords() || ''
  const updatedKeywords = existingKeywords
    ? `${existingKeywords}; ${forensicTag}`
    : forensicTag

  pdfDoc.setSubject(`Protected Document [ID: ${payload.purchaseId.substring(0, 8)}]`)
  pdfDoc.setKeywords([updatedKeywords])

  // 4. Inyectar clave custom directa en el diccionario Info del PDF (Incrustación profunda)
  // Esto hace que el valor viva dentro de las estructuras internas del PDF
  pdfDoc.setProducer(`PrintablesVault Forensics (${forensicTag})`)

  // 5. Guardar el PDF modificado y retornarlo como Buffer
  const modifiedPdfBytes = await pdfDoc.save()
  return Buffer.from(modifiedPdfBytes)
}

/**
 * Extrae y decodifica la marca forense de un PDF
 */
export async function extractForensicMetadata(
  pdfBuffer: Buffer
): Promise<{ pid: string; eh: string; ts: number } | null> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const producer = pdfDoc.getProducer() || ''
    const keywords = pdfDoc.getKeywords() || ''

    // Buscar el patrón "WM-R2-" en los campos
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