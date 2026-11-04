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

  const numId = Number(id)
  if (isNaN(numId) || numId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El ID del insumo debe ser un número válido.'
    })
  }

  await InventoryService.deleteMaterial(event, numId, requestId)

  return {
    success: true,
    message: 'Insumo eliminado correctamente del almacén'
  }
})

