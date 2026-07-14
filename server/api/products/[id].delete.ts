import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Capturamos el ID desde la URL
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Se requiere el ID del producto en la URL para poder eliminarlo.'
    })
  }

  // 2. Conectamos con Supabase
  const supabase = await serverSupabaseClient<any>(event)

  // 3. Ejecutamos la orden de borrado DONDE (.eq) el id coincida
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  // 4. Si la base de datos rechaza el borrado, arrojamos error
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al eliminar el producto: ' + error.message
    })
  }

  // 5. Confirmamos el éxito del borrado
  return {
    success: true,
    message: `Producto con ID ${id} eliminado correctamente del catálogo.`
  }
})