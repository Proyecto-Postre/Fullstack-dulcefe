import type { H3Event } from 'h3'
import { getHeader, setResponseHeader } from 'h3'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Obtiene o genera un X-Request-Id (UUIDv4) para trazabilidad en logs y respuestas.
 */
export function getOrCreateRequestId(event: H3Event): string {
  const incomingId = getHeader(event, 'x-request-id')
  
  const requestId = incomingId && UUID_V4_REGEX.test(incomingId)
    ? incomingId
    : crypto.randomUUID()

  setResponseHeader(event, 'x-request-id', requestId)
  return requestId
}
