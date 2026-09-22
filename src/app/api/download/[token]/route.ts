// src/app/api/download/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { stampPdf } from '@/lib/forensics/stamp'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno para Supabase Admin')
  }

  return createClient(url, key)
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Faltan credenciales de Cloudflare R2 en .env.local')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

interface RouteParams {
  params: Promise<{
    token: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // 1. Validar token
    const { data: tokenData, error } = await supabaseAdmin
      .from('access_tokens')
      .select(`
        id,
        token,
        download_count,
        expires_at,
        purchases (
          id,
          buyer_email,
          products (
            id,
            name,
            master_file_key
          )
        )
      `)
      .eq('token', token)
      .single()

    if (error || !tokenData) {
      return NextResponse.json(
        { error: 'El enlace de descarga no existe o ha sido modificado. Contactá a la creadora para solicitar ayuda.' }, 
        { status: 404 }
      )
    }

    // 2. Verificar expiración
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'El plazo de tiempo para descargar tu archivo ha expirado. Contactá a la creadora si perdiste tu archivo.' }, 
        { status: 410 }
      )
    }

    // 3. Verificar límite de descargas (5 máximo)
    const maxDownloads = 5
    const currentDownloads = tokenData.download_count ?? 0
    if (currentDownloads >= maxDownloads) {
      return NextResponse.json(
        { error: `Has alcanzado el límite máximo de ${maxDownloads} descargas permitidas. Contactá a la creadora si perdiste tu archivo.` }, 
        { status: 429 }
      )
    }

    // Mapeo de compra y producto
    const purchase = Array.isArray(tokenData.purchases)
      ? tokenData.purchases[0]
      : tokenData.purchases

    const product = purchase?.products
      ? (Array.isArray(purchase.products) ? purchase.products[0] : purchase.products)
      : null

    const fileKey = product?.master_file_key
    if (!fileKey) {
      return NextResponse.json(
        { error: 'El archivo asociado al producto no está disponible. Contactá a la creadora.' }, 
        { status: 404 }
      )
    }

    // 4. Descargar archivo máster desde Cloudflare R2
    const r2 = getR2Client()
    const bucketName = process.env.R2_BUCKET_NAME || 'printables-vault'

    const getObjectCmd = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    })

    const r2Response = await r2.send(getObjectCmd)
    if (!r2Response.Body) {
      throw new Error('El archivo recuperado de R2 está vacío')
    }

    const byteArray = await r2Response.Body.transformToByteArray()
    const masterBuffer = Buffer.from(byteArray)

    // 5. Estampar la marca forense en el PDF usando lib/forensics/stamp
    const purchaseId = purchase?.id || 'unknown-purchase'
    const buyerEmail = purchase?.buyer_email || 'unknown-buyer'

    console.log(`🔒 Aplicando marca forense (capa 1 + capa 2) para ${buyerEmail}...`)
    const finalBuffer = await stampPdf(masterBuffer, purchaseId, buyerEmail)

    // 6. Incrementar contador de descargas
    await supabaseAdmin
      .from('access_tokens')
      .update({ download_count: currentDownloads + 1 })
      .eq('id', tokenData.id)

    // Registrar en forensic_marks
    try {
      await supabaseAdmin.from('forensic_marks').insert({
        token_id: tokenData.id,
        purchase_id: purchaseId,
        downloaded_at: new Date().toISOString(),
      })
    } catch (_) {
      // Ignorar si la tabla no está creada aún
    }

    // 7. Servir el PDF estampado al cliente
    const rawName = product?.name || 'producto'
    const safeFilename = `${rawName.replace(/[^a-z0-9]/gi, '_')}.pdf`

    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': finalBuffer.length.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err: any) {
    console.error('❌ Error grave en la API de descarga:', err)
    return NextResponse.json(
      { error: 'Error interno al generar la descarga', detalle: err.message }, 
      { status: 500 }
    )
  }
}