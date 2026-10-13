import { defineEventHandler, readBody, createError } from 'h3'
import { getOrCreateRequestId } from '../../../utils/request-id'
import { CatalogService } from '../../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const body = await readBody(event)

  if (!body || !body.name || !body.name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El nombre de la categoría es obligatorio.'
    })
  }

  const category = await CatalogService.createCategory(
    event,
    {
      id: body.id,
      name: body.name,
      icon: body.icon,
      sort_order: body.sort_order,
      is_active: body.is_active
    },
    requestId
  )

  return {
    success: true,
    message: 'Categoría creada exitosamente.',
    data: category
  }
})
