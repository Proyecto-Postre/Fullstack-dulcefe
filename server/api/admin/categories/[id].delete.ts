import { defineEventHandler, getRouterParam, createError } from 'h3'
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

  const result = await CatalogService.deleteCategory(event, id, requestId)
  return {
    success: true,
    message: 'Categoría eliminada exitosamente.',
    data: result
  }
})
