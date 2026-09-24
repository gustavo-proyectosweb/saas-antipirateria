// src/lib/forensics/lsb.ts
import sharp from 'sharp'

// Marcador único para identificar que la imagen contiene un payload LSB
const LSB_PREFIX = 'STAMP_LSB:'

/**
 * Convierte un string a un arreglo de bits (0s y 1s)
 */
function stringToBits(str: string): number[] {
  const bits: number[] = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    for (let bit = 7; bit >= 0; bit--) {
      bits.push((code >> bit) & 1)
    }
  }
  return bits
}

/**
 * Convierte un arreglo de bits de vuelta a string
 */
function bitsToString(bits: number[]): string {
  let str = ''
  for (let i = 0; i < bits.length; i += 8) {
    let code = 0
    for (let bit = 0; bit < 8; bit++) {
      if (bits[i + bit] !== undefined) {
        code = (code << 1) | bits[i + bit]
      }
    }
    if (code === 0) break // Fin de cadena
    str += String.fromCharCode(code)
  }
  return str
}

/**
 * Oculta el purchaseId dentro del buffer de una imagen utilizando LSB
 */
export async function encodeLsbToImage(imageBuffer: Buffer, purchaseId: string): Promise<Buffer> {
  const payload = `${LSB_PREFIX}${purchaseId}\0` // Usamos \0 como terminador
  const payloadBits = stringToBits(payload)

  // Decodificamos la imagen a raw pixels (RGB)
  const image = sharp(imageBuffer)
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('No se pudieron leer las dimensiones de la imagen')
  }

  const rawBuffer = await image.raw().toBuffer()

  // Verificamos que la imagen tenga suficientes píxeles para el payload
  if (rawBuffer.length < payloadBits.length) {
    throw new Error('La imagen es demasiado pequeña para contener la marca forense LSB')
  }

  // Modificamos el bit menos significativo (LSB) de los bytes de la imagen
  for (let i = 0; i < payloadBits.length; i++) {
    // Si el bit a ocultar es 1, hacemos que el byte sea impar; si es 0, que sea par.
    rawBuffer[i] = (rawBuffer[i] & 0xfe) | payloadBits[i]
  }

  // Re-empaquetamos la imagen en formato PNG (sin pérdida)
  return await sharp(rawBuffer, {
    raw: {
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels || 3,
    },
  })
    .png()
    .toBuffer()
}

/**
 * Decodifica y recupera el purchaseId desde el buffer de una imagen
 */
export async function decodeLsbFromImage(imageBuffer: Buffer): Promise<string | null> {
  try {
    const image = sharp(imageBuffer)
    const rawBuffer = await image.raw().toBuffer()

    const extractedBits: number[] = []
    // Leemos los LSB de los primeros bytes de la imagen (hasta un máximo razonable)
    const maxReadBits = (LSB_PREFIX.length + 40) * 8

    for (let i = 0; i < Math.min(rawBuffer.length, maxReadBits); i++) {
      extractedBits.push(rawBuffer[i] & 1)
    }

    const decodedText = bitsToString(extractedBits)

    if (decodedText.startsWith(LSB_PREFIX)) {
      const purchaseId = decodedText.replace(LSB_PREFIX, '').replace(/\0.*$/, '')
      return purchaseId
    }

    return null
  } catch (error) {
    return null
  }
}