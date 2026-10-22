/**
 * Utilidades unificadas para detección y gestión de entornos en Dulce Fe.
 * Soporta de forma transparente:
 * - Vercel Production (`VERCEL_ENV=production` o `APP_ENV=production`)
 * - Vercel Preview (`VERCEL_ENV=preview` o `APP_ENV=preview`)
 * - Desarrollo Local (`APP_ENV=development`, `NODE_ENV=development` o localhost)
 * - Entornos de Test (`NODE_ENV=test` en Vitest / CI)
 */

export type AppEnvironment = 'production' | 'preview' | 'development' | 'test'

/**
 * Resuelve el entorno de ejecución actual con jerarquía estricta.
 */
export function getAppEnvironment(): AppEnvironment {
  const explicitEnv = (process.env.APP_ENV || process.env.VERCEL_ENV || '').trim().toLowerCase()
  if (explicitEnv === 'production') return 'production'
  if (explicitEnv === 'preview' || explicitEnv === 'staging') return 'preview'
  if (explicitEnv === 'development' || explicitEnv === 'local' || explicitEnv === 'dev') return 'development'

  if (process.env.NODE_ENV === 'test') return 'test'

  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || ''
  if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
    return 'development'
  }

  if (process.env.NODE_ENV === 'production') {
    return 'production'
  }

  return 'development'
}

/**
 * Determina si el entorno actual es producción real.
 */
export function isProduction(): boolean {
  return getAppEnvironment() === 'production'
}

/**
 * Determina si el entorno actual es cualquier ambiente no productivo (local, dev, preview o test).
 */
export function isNonProduction(): boolean {
  return !isProduction()
}

/**
 * Obtiene la URL canónica del sitio para enlaces absolutos (tracking, correos, webhooks).
 * Resuelve automáticamente URLs de Vercel (Preview o Production) y fallback local.
 */
export function getCanonicalSiteUrl(): string {
  if (process.env.NUXT_PUBLIC_SITE_URL && process.env.NUXT_PUBLIC_SITE_URL.trim() !== '') {
    return process.env.NUXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '')
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, '')}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`
  }

  if (isProduction()) {
    return 'https://dulcefe.pe'
  }

  return 'http://localhost:3000'
}

/**
 * Retorna el prefijo para asuntos de correo y notificaciones según el entorno.
 * Cero emojis: utiliza etiquetas claras en texto.
 */
export function getEnvironmentSubjectPrefix(): string {
  const env = getAppEnvironment()
  if (env === 'production') return ''
  if (env === 'preview') return '[PREVIEW] '
  return '[PRUEBA / DEV] '
}

/**
 * Retorna el texto para el banner de alerta en plantillas de correo.
 * Cero emojis: advertencia formal y visible.
 */
export function getEnvironmentAlertBannerText(): string | null {
  const env = getAppEnvironment()
  if (env === 'production') return null
  if (env === 'preview') {
    return 'AVISO: PEDIDO DE PRUEBA (ENTORNO VERCEL PREVIEW) — NO DESPACHAR EN TALLER'
  }
  return 'AVISO: PEDIDO DE PRUEBA (ENTORNO LOCAL / DEV) — NO DESPACHAR EN TALLER'
}
