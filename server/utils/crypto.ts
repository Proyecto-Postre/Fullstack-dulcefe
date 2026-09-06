import crypto from 'node:crypto'

/**
 * Utilidades criptográficas del servidor (Fase 6 / ADR-002 / D2)
 * Provee generación determinista y segura de tokens opacos para tracking de pedidos sin login.
 */

const DEFAULT_SECRET = 'dulcefe_secure_tracking_secret_production_salt_v1'

/**
 * Genera un token HMAC-SHA256 opaco e inmutable de 64 caracteres hex.
 * Derivado del ID de orden, timestamp de creación y una sal criptográfica segura.
 */
export function generateOrderTrackingToken(orderId: string, createdAt: string, customSalt?: string): string {
  const secret = process.env.TRACKING_TOKEN_SECRET || DEFAULT_SECRET
  const salt = customSalt || crypto.randomBytes(8).toString('hex')
  
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}:${createdAt}:${salt}`)
    .digest('hex')
}

/**
 * Valida si un string cumple con la especificación estricta de un token de tracking (64 hex lowercase).
 */
export function isValidTrackingTokenFormat(token: string): boolean {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
}

/**
 * Genera la firma HMAC-SHA256 para webhooks de salida hacia n8n/Make (ADR-006 / D6).
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Valida la firma HMAC-SHA256 usando tiempo constante para prevenir timing attacks.
 */
export function verifyWebhookSignature(payload: string, secret: string, receivedSignature: string): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  if (expectedSignature.length !== receivedSignature.length) {
    return false
  }
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(receivedSignature, 'utf-8')
  )
}

