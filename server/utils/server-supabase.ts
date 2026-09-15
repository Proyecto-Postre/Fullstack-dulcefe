import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'

/**
 * Valida si una clave JWT es genuinamente una service_role key y no una anon key copiada por error.
 */
function isGenuineServiceRoleKey(key?: string): boolean {
  if (!key || typeof key !== 'string' || key.trim() === '') return false
  try {
    const parts = key.split('.')
    if (parts.length < 2) return false
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

/**
 * Helper centralizado para obtener el cliente de Supabase en handlers y servicios del servidor.
 * Si existe una clave privada de servicio válida y genuina (role === 'service_role'),
 * utiliza serverSupabaseServiceRole para eludir RLS en operaciones privilegiadas.
 * De lo contrario, utiliza de forma segura serverSupabaseClient (que aplica RLS con la identidad
 * del usuario autenticado en la sesión actual) evitando bloqueos de RLS por clave anónima.
 */
export async function getAdminSupabaseClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  const serviceKey =
    config.supabase?.serviceKey ||
    config.supabase?.secretKey ||
    config.supabaseServiceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NUXT_SUPABASE_SECRET_KEY

  if (isGenuineServiceRoleKey(serviceKey)) {
    try {
      return serverSupabaseServiceRole<Database>(event)
    } catch {
      return await serverSupabaseClient<Database>(event)
    }
  }

  return await serverSupabaseClient<Database>(event)
}

