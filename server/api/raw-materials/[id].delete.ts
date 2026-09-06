import { getOrCreateRequestId } from '../../utils/request-id'
import { InventoryService } from '../../services/inventory.service'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Se requiere el ID del insumo en la URL para poder eliminarlo.'
    })
  }

  // Eliminar recetas que usan este insumo con service role
  const supabase = serverSupabaseServiceRole<Database>(event)
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

