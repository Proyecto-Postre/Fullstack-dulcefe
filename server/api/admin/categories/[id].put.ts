import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { getOrCreateRequestId } from '../../../utils/request-id'
import { CatalogService } from '../../../services/catalog.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de categoría obligatorio.'
    })
  }

  const body = await readBody(event)
  const category = await CatalogService.updateCategory(
    event,
    id,
    {
      name: body?.name,
      icon: body?.icon,
      sort_order: body?.sort_order,
      is_active: body?.is_active
    },
    requestId
  )

  return {
    success: true,
    message: 'Categoría actualizada correctamente.',
    data: category
  }
})
