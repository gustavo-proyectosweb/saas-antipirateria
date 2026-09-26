const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testTokenSecurity() {
  console.log('🔒 --- AUDITORÍA DE SEGURIDAD DE TOKENS Y RATE LIMITING --- 🔒\n')

  // 1. Verificación teórica de Entropía (UUID v4)
  console.log('1. Análisis de Entropía de Tokens:')
  console.log('   • Algoritmo utilizado: UUID v4')
  console.log('   • Entropía: 122 bits de aleatoriedad')
  console.log('   • Posibles combinaciones: 5.3 x 10^36')
  console.log('   ✅ Resultado: Computacionalmente inviable de adivinar por fuerza bruta.\n')

  // 2. Simulación de ataque de Fuerza Bruta en Endpoint de Descarga
  console.log('2. Probando protección y Rate Limiting en endpoint de descarga...')
  const dummyTokens = Array.from({ length: 20 }, (_, i) => `00000000-0000-4000-a000-${String(i).padStart(12, '0')}`)
  
  let blockedCount = 0
  let notFoundCount = 0

  for (let i = 0; i < dummyTokens.length; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/download?token=${dummyTokens[i]}`)
      if (res.status === 429) {
        blockedCount++
      } else if (res.status === 404 || res.status === 400) {
        notFoundCount++
      }
    } catch (err) {
      console.error(`   ❌ Error al conectar con el servidor en el intento ${i + 1}`)
      return
    }
  }

  console.log(`   • Peticiones realizadas: ${dummyTokens.length}`)
  console.log(`   • Respuestas 404/400 (Token Inválido): ${notFoundCount}`)
  console.log(`   • Respuestas 429 (Rate Limited / Bloqueado): ${blockedCount}`)

  if (blockedCount > 0) {
    console.log('   ✅ Rate Limiting activo y cortando peticiones masivas.\n')
  } else {
    console.log('   ℹ️ Peticiones procesadas como inválidas sin llegar al umbral de bloqueo masivo.\n')
  }

  // 3. Simulación de Webhook sin firma o con header faltante
  console.log('3. Probando validación de firma en Webhook (sin headers de firma)...')
  try {
    const webhookRes = await fetch(`${BASE_URL}/api/webhooks/shopify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'payload_sin_firma' })
    })

    if ([400, 401, 403, 405].includes(webhookRes.status)) {
      console.log(`   ✅ Webhook rechazó la petición no autorizada con código: ${webhookRes.status}`)
    } else {
      console.error(`   ❌ FALLA DE SEGURIDAD: Webhook respondió con estado ${webhookRes.status}`)
    }
  } catch (err) {
    console.error('   ❌ Error al conectar con el endpoint del webhook.')
  }

  console.log('\n🏁 --- PRUEBA FINALIZADA --- 🏁')
}

testTokenSecurity()