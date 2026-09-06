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
