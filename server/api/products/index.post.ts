import { getOrCreateRequestId } from '../../utils/request-id'
import { CatalogService } from '../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)

  const body = await readBody(event)
  const { name, price, stock, image_url } = body || {}

  if (!name || price === undefined || price === null) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El nombre y el precio del producto son obligatorios.'
    })
  }

  const data = await CatalogService.createProduct(
    event,
    { name, price, stock, image_url },
    requestId
  )

  return {
    success: true,
    message: 'Producto creado exitosamente en el catálogo de Dulce Fe',
    data: [data]
  }
})