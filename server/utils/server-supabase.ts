import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'

/**
 * Helper centralizado para obtener el cliente de Supabase en handlers y servicios del servidor.
 * Si existe una clave privada de servicio configurada (SUPABASE_SERVICE_ROLE_KEY / serviceKey),
 * utiliza serverSupabaseServiceRole para eludir RLS en operaciones privilegiadas.
 * De lo contrario, utiliza de forma segura serverSupabaseClient (que aplica RLS con la identidad
 * del usuario autenticado) evitando arrojar errores por clave faltante.
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

  if (serviceKey && typeof serviceKey === 'string' && serviceKey.trim() !== '') {
    try {
      return serverSupabaseServiceRole<Database>(event)
    } catch {
      return await serverSupabaseClient<Database>(event)
    }
  }

  return await serverSupabaseClient<Database>(event)
}
