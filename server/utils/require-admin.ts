import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'
import type { User } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export type UserProfile = Database['public']['Tables']['profiles']['Row']

export interface AdminAuthContext {
  user: User
  profile: UserProfile
}

/**
 * Guard de servidor para requerir privilegios de administrador.
 * Lanza 401 si no está autenticado y 403 si profiles.is_admin !== true.
 * Cero confianza en claims de JWT: consulta la base de datos directamente.
 */
export async function requireAdmin(event: H3Event): Promise<AdminAuthContext> {
  // 1. Validar autenticación base (lanza 401 si no hay sesión)
  const user = await requireUser(event)

  // 2. Reutilizar perfil si ya fue resuelto en este request
  if (event.context.profile) {
    const profile = event.context.profile as UserProfile
    if (profile.is_admin === true) {
      return { user, profile }
    }
  }

  // 3. Consultar la tabla profiles en PostgreSQL
  // Se prioriza Service Role para evitar dependencias circulares de RLS en profiles
  let supabase
  try {
    supabase = serverSupabaseServiceRole<Database>(event)
  } catch {
    supabase = await serverSupabaseClient<Database>(event)
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 4. Si el perfil no existe o ocurre un error al consultar
  if (error || !profile) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'No se encontró el perfil del usuario para validar permisos.'
        }
      }
    })
  }

  // 5. Validar explícitamente el booleano is_admin en base de datos
  if (profile.is_admin !== true) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        error: {
          code: 'FORBIDDEN',
          message: 'Se requieren privilegios de administrador para realizar esta acción.'
        }
      }
    })
  }

  // 6. Cachear perfil en el contexto del evento y retornar
  event.context.profile = profile
  return { user, profile }
}
