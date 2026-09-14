import { getOrCreateRequestId } from '../../utils/request-id'
import { InventoryService } from '../../services/inventory.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Se requiere el ID del insumo en la URL para poder eliminarlo.'
    })
  }

  // Eliminar recetas que usan este insumo con service role o admin client
  const supabase = await getAdminSupabaseClient(event)
  await supabase
    .from('recipe_items')
    .delete()
    .eq('raw_material_id', Number(id))

  await InventoryService.deleteMaterial(event, Number(id), requestId)

  return {
    success: true,
    message: 'Insumo eliminado correctamente del almacén'
  }
})

