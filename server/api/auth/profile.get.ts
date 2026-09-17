import { defineEventHandler, createError } from 'h3'
import { requireUser } from '../../utils/require-user'
import { getAdminSupabaseClient } from '../../utils/server-supabase'
import type { Database } from '~/types/database.types'

type UserProfile = Database['public']['Tables']['profiles']['Row']

export default defineEventHandler(async (event) => {
  // 1. Requerir usuario autenticado en la sesión de Supabase
  const user = await requireUser(event)
  const userId = user.id || (user as unknown as { sub?: string }).sub || ''

  // 2. Obtener cliente Supabase privilegiado de servidor
  const supabase = await getAdminSupabaseClient(event)

  // 3. Consultar la tabla profiles directamente en PostgreSQL
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Perfil de usuario no encontrado en la base de datos.'
        }
      }
    })
  }

  return {
    success: true,
    data: profile as UserProfile
  }
})
