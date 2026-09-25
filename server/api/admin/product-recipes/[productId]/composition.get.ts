import { getOrCreateRequestId } from '../../../../utils/request-id'
import { BatchRecipeService } from '../../../../services/batch-recipe.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const productIdParam = getRouterParam(event, 'productId')
  const productId = Number(productIdParam)

  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de producto inválido.' })
  }

  const data = await BatchRecipeService.getProductBatchComposition(event, productId, requestId)
  return { success: true, data }
})
