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
  const user = await serverSupabaseUser(event)

  if (!user) {
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

  // 3. Cachear en el contexto del evento
  event.context.user = user
  return user
}
