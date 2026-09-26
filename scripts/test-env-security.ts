import * as fs from 'fs'
import * as path from 'path'

const CRITICAL_KEYWORDS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'R2_SECRET_ACCESS_KEY',
  'SHOPIFY_WEBHOOK_SECRET'
]

function scanDirectory(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (
      stat.isDirectory() &&
      !filePath.includes('node_modules') &&
      !filePath.includes('.next') &&
      !filePath.includes('.git')
    ) {
      scanDirectory(filePath, fileList)
    } else if (
      stat.isFile() &&
      (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js'))
    ) {
      fileList.push(filePath)
    }
  })

  return fileList
}

function auditSecretLeaks() {
  console.log('🔒 --- AUDITORÍA DE SECRETOS Y VARIABLES DE ENTORNO --- 🔒\n')

  // 1. Verificar .gitignore
  console.log('1. Verificando que .env.local esté ignorado por Git...')
  if (fs.existsSync('.gitignore')) {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf-8')
    if (gitignoreContent.includes('.env*.local') || gitignoreContent.includes('.env')) {
      console.log('   ✅ `.env.local` está correctamente incluido en .gitignore\n')
    } else {
      console.error('   ❌ ALERTA: `.env.local` NO está en .gitignore!')
    }
  }

  // 2. Escanear código buscando NEXT_PUBLIC_ mal usado
  console.log('2. Escaneando código fuente buscando malas prácticas con NEXT_PUBLIC_...')
  const projectFiles = scanDirectory('./src')
  let leakedPublicVars = 0

  projectFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8')
    CRITICAL_KEYWORDS.forEach((keyword) => {
      if (content.includes(`NEXT_PUBLIC_${keyword}`)) {
        console.error(`   ❌ ALERTA DE SEGURIDAD: Se encontró "NEXT_PUBLIC_${keyword}" en: ${file}`)
        leakedPublicVars++
      }
    })
  })

  if (leakedPublicVars === 0) {
    console.log('   ✅ Ningún secreto crítico utiliza el prefijo `NEXT_PUBLIC_` en el cliente.\n')
  }

  console.log('🏁 --- AUDITORÍA DE SECRETOS FINALIZADA --- 🏁')
}

auditSecretLeaks()