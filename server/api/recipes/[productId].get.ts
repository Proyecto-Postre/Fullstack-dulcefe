import { getOrCreateRequestId } from '../../utils/request-id'
import { RecipeService } from '../../services/recipe.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const productId = getRouterParam(event, 'productId') || event.context.params?.productId || event.context.params?.id || event.context.params?.product_id

  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el ID del producto.' })
  }

  const recipe = await RecipeService.getRecipeWithCosts(event, Number(productId), requestId)

  return {
    success: true,
    totalCost: Number(recipe.total_cost),
    data: recipe.items
  }
})