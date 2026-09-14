import { getOrCreateRequestId } from '../../utils/request-id'
import { CatalogService } from '../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Se requiere el ID del producto en la URL para poder eliminarlo.'
    })
  }

  // Limpiar recetas asociadas con service role o admin client
  const supabase = await getAdminSupabaseClient(event)
  await supabase
    .from('recipe_items')
    .delete()
    .eq('product_id', Number(id))

  await CatalogService.deleteProduct(event, Number(id), requestId)

  return {
    success: true,
    message: 'Producto eliminado exitosamente del catálogo'
  }
})