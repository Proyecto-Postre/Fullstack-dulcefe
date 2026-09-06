import { getOrCreateRequestId } from '../../utils/request-id'
import { CatalogService } from '../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Falta el ID del producto en la URL para poder actualizarlo.'
    })
  }

  const body = await readBody(event)
  const { name, price, stock, image_url } = body || {}

  const data = await CatalogService.updateProduct(
    event,
    Number(id),
    { name, price, stock, image_url },
    requestId
  )

  return {
    success: true,
    message: 'Producto actualizado correctamente en Dulce Fe',
    data: [data]
  }
})