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
      statusMessage: 'Se requiere el ID del producto en la URL para poder eliminarlo.'
    })
  }

  // 2. Conectamos con Supabase
  const supabase = await serverSupabaseClient<Database>(event)

  // 3. Primero eliminamos los items de la receta asociados a este producto
  const { error: recipeError } = await supabase
    .from('recipe_items')
    .delete()
    .eq('product_id', Number(id))

  if (recipeError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al eliminar la receta del producto: ' + recipeError.message
    })
  }

  // 4. Ejecutamos la orden de borrado DONDE (.eq) el id coincida
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', Number(id))

  // 5. Si la base de datos rechaza el borrado, arrojamos error
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al eliminar el producto: ' + error.message
    })
  }

  // 6. Confirmamos el éxito del borrado
  return {
    success: true,
    message: `Producto con ID ${id} eliminado correctamente del catálogo.`
  }
})