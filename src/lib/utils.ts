// src/lib/utils.ts

/**
 * Enmascara parcialmente un correo electrónico por privacidad.
 * Ejemplo: juan.perez@gmail.com -> j***z@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com'

  const [localPart, domain] = email.split('@')

  if (!localPart || localPart.length === 0) {
    return `***@${domain}`
  }

  if (localPart.length === 1) {
    return `${localPart}***@${domain}`
  }

  if (localPart.length === 2) {
    return `${localPart[0]}***@${domain}`
  }

  const firstChar = localPart[0]
  const lastChar = localPart[localPart.length - 1]
  return `${firstChar}***${lastChar}@${domain}`
}

/**
 * Formatea una fecha a una representación legible en español (Argentina).
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Sin descargas aún'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Fecha no válida'

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}