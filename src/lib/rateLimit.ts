// src/lib/rateLimit.ts

interface RateLimitStore {
  [ip: string]: number[]
}

// Almacenamiento en memoria para las peticiones por IP
const tracker: RateLimitStore = {}

/**
 * Limpia peticiones antiguas para no consumir memoria indefinidamente.
 */
function cleanupTracker(windowMs: number) {
  const now = Date.now()
  for (const ip in tracker) {
    tracker[ip] = tracker[ip].filter((timestamp) => now - timestamp < windowMs)
    if (tracker[ip].length === 0) {
      delete tracker[ip]
    }
  }
}

// Limpiar el almacén cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => cleanupTracker(60 * 1000), 5 * 60 * 1000)
}

/**
 * Evalúa si una IP superó el número máximo de peticiones dentro de un intervalo.
 * 
 * @param ip IP del cliente
 * @param limit Número máximo de peticiones permitidas (ej. 10)
 * @param windowMs Ventana de tiempo en milisegundos (ej. 60000 ms = 1 minuto)
 */
export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { isRateLimited: boolean; currentCount: number } {
  const now = Date.now()

  if (!tracker[ip]) {
    tracker[ip] = []
  }

  // Filtrar solo las peticiones que ocurrieron en la última ventana de tiempo
  tracker[ip] = tracker[ip].filter((timestamp) => now - timestamp < windowMs)

  if (tracker[ip].length >= limit) {
    return { isRateLimited: true, currentCount: tracker[ip].length }
  }

  // Registrar la petición actual
  tracker[ip].push(now)
  return { isRateLimited: false, currentCount: tracker[ip].length }
}

/**
 * Obtiene la IP real del cliente desde las cabeceras de Next.js/Vercel.
 */
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }
  return '127.0.0.1'
}