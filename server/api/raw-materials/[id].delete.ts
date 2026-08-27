import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  // 🔒 Validación de privilegios de administrador (Fase 1 - PR-1b)
  await requireAdmin(event)

  // 1. Capturamos el ID desde la URL
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Se requiere el ID del insumo en la URL para poder eliminarlo.'
    })
  }

  // 2. Conectamos con Supabase
  const supabase = await serverSupabaseClient<Database>(event)

  // 3. Primero eliminamos los items de recetas que usan este insumo
  const { error: recipeError } = await supabase
    .from('recipe_items')
    .delete()
    .eq('raw_material_id', Number(id))

  if (recipeError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al eliminar el insumo de las recetas: ' + recipeError.message
    })
  }

  // 4. Ejecutamos la orden de borrado DONDE (.eq) el id coincida
  const { error } = await supabase
    .from('raw_materials')
    .delete()
    .eq('id', Number(id))

  // 4. Si la base de datos rechaza el borrado, arrojamos error
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al eliminar el insumo: ' + error.message
    })
  }

  // 5. Confirmamos el éxito del borrado
  return {
    success: true,
    message: `Insumo con ID ${id} eliminado correctamente del inventario.`
  }
})
