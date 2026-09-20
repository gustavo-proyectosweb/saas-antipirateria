import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getR2Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('❌ Faltan credenciales de R2 (endpoint, accessKeyId o secretAccessKey) en .env.local')
  }

  return new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME
  if (!bucket) {
    throw new Error('❌ La variable R2_BUCKET_NAME no está configurada en .env.local')
  }
  return bucket
}

/**
 * Subir un archivo (Buffer) a Cloudflare R2
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string = 'application/pdf'
): Promise<string> {
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await client.send(command)
  return key
}

/**
 * Descargar un archivo desde R2 y obtener su contenido como Buffer
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  const client = getR2Client()
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  const response = await client.send(command)

  if (!response.Body) {
    throw new Error(`No se pudo obtener el cuerpo del archivo: ${key}`)
  }

  const byteArray = await response.Body.transformToByteArray()
  return Buffer.from(byteArray)
}

/**
 * Generar una URL firmada temporal para descarga directa
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getR2Client()
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}