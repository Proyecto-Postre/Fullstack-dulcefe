import { getOrCreateRequestId } from '../../utils/request-id'
import { InventoryService } from '../../services/inventory.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)

  const body = await readBody(event)
  const { name, unit, purchase_price, purchase_quantity, stock } = body || {}

  if (!name || !unit || !purchase_price || !purchase_quantity) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todos los campos de costo son obligatorios.'
    })
  }

  const data = await InventoryService.createMaterial(
    event,
    { name, unit, purchase_price, purchase_quantity, stock },
    requestId
  )

  return {
    success: true,
    data: [data]
  }
})