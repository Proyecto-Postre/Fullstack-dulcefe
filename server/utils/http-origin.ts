import type { H3Event } from 'h3'
import { getHeader, createError } from 'h3'

/**
 * Valida la cabecera Origin en mutaciones HTTP para mitigar ataques CSRF / cross-site.
 */
export function validateRequestOrigin(event: H3Event, requestId: string): void {
  const origin = getHeader(event, 'origin')
  
  // Si no hay Origin (peticiones directas o curl de pruebas), permitimos continuar
  if (!origin) return

  // Permitir desarrollo local en cualquier puerto (3000, 3001, 3002, etc.)
  const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  if (isLocalDev) return

  let siteUrl: string | null = null
  try {
    if (typeof useRuntimeConfig === 'function') {
      const config = useRuntimeConfig()
      siteUrl = config.public?.siteUrl ? new URL(config.public.siteUrl).origin : null
    }
  } catch {
    // Entorno sin runtime config (pruebas unitarias)
  }

  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  
  const allowedOrigins = [
    siteUrl,
    vercelUrl
  ].filter((o): o is string => Boolean(o))

  const isVercel = origin.endsWith('.vercel.app')
  const isAllowed = isVercel || allowedOrigins.some(allowed => origin === allowed)

  if (!isAllowed) {
    throw createError({
      statusCode: 403,
      statusMessage: 'FORBIDDEN_ORIGIN',
      data: {
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Origen no autorizado para realizar mutaciones',
          request_id: requestId
        }
      }
    })
  }
}
