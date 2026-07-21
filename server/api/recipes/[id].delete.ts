import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el ID del ingrediente en la receta.' })
  }

  const supabase = await serverSupabaseClient<any>(event)

  const { error } = await supabase
    .from('recipe_items')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Error al quitar el insumo: ' + error.message })
  }

  return { success: true }
})