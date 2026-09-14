import { serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'
import type { User } from '@supabase/supabase-js'

/**
 * Guard de servidor para requerir autenticación de usuario.
 * Lanza 401 Unauthorized si no hay sesión activa.
 */
export async function requireUser(event: H3Event): Promise<User> {
  // 1. Reutilizar usuario si ya fue resuelto en este request
  if (event.context.user) {
    return event.context.user as User
  }

  // 2. Resolver usuario desde la sesión de Supabase
  const rawUser = await serverSupabaseUser(event)

  if (!rawUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Se requiere iniciar sesión para acceder a este recurso.'
        }
      }
    })
  }

  // Normalizar id vs sub para interoperabilidad con JwtPayload de @nuxtjs/supabase v2
  const userId = (rawUser as { id?: string; sub?: string }).id || (rawUser as { sub?: string }).sub || ''
  const user = {
    ...rawUser,
    id: userId,
    sub: userId
  } as unknown as User

  // 3. Cachear en el contexto del evento
  if (event.context) {
    event.context.user = user
  }
  return user
}
