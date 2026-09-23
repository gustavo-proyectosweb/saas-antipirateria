// src/lib/rateLimit.ts

interface RateLimitStore {
  [ip: string]: number[]
}

const tracker: RateLimitStore = {}

function cleanupTracker(windowMs: number) {
  const now = Date.now()
  for (const ip in tracker) {
    tracker[ip] = tracker[ip].filter((timestamp) => now - timestamp < windowMs)
    if (tracker[ip].length === 0) {
      delete tracker[ip]
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => cleanupTracker(60 * 1000), 5 * 60 * 1000)
}

export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { isRateLimited: boolean; currentCount: number } {
  const now = Date.now()

  if (!tracker[ip]) {
    tracker[ip] = []
  }

  // Filtrar peticiones vigentes
  tracker[ip] = tracker[ip].filter((timestamp) => now - timestamp < windowMs)

  if (tracker[ip].length >= limit) {
    return { isRateLimited: true, currentCount: tracker[ip].length }
  }

  tracker[ip].push(now)
  return { isRateLimited: false, currentCount: tracker[ip].length }
}

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