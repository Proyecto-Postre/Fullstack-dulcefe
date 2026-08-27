import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  // 🔒 Validación de privilegios de administrador (Fase 1 - PR-1b)
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el ID del ingrediente en la receta.' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { error } = await supabase
    .from('recipe_items')
    .delete()
    .eq('id', Number(id))

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Error al quitar el insumo: ' + error.message })
  }

  return { success: true }
})