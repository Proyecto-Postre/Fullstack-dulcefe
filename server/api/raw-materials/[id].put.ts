import { getOrCreateRequestId } from '../../utils/request-id'
import { InventoryService } from '../../services/inventory.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Falta el ID del insumo en la URL para poder actualizarlo.'
    })
  }

  const body = await readBody(event)
  const { name, unit, purchase_price, purchase_quantity, stock, reason } = body || {}

  const data = await InventoryService.updateMaterial(
    event,
    Number(id),
    { name, unit, purchase_price, purchase_quantity, stock, reason },
    requestId
  )

  return {
    success: true,
    message: 'Insumo actualizado correctamente en el inventario.',
    data: [data]
  }
})

