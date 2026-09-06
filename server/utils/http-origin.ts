import type { H3Event } from 'h3'
import { getHeader, createError } from 'h3'

/**
 * Valida la cabecera Origin en mutaciones HTTP para mitigar ataques CSRF / cross-site.
 */
export function validateRequestOrigin(event: H3Event, requestId: string): void {
  const origin = getHeader(event, 'origin')
  
  // Si no hay Origin (peticiones directas o curl de pruebas), permitimos continuar
  if (!origin) return

  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl ? new URL(config.public.siteUrl).origin : null
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  
  const allowedOrigins = [
    siteUrl,
    vercelUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].filter((o): o is string => Boolean(o))

  const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.vercel.app'))

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
