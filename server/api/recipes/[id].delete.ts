import { getOrCreateRequestId } from '../../utils/request-id'
import { RecipeService } from '../../services/recipe.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el ID del ingrediente en la receta.' })
  }

  await RecipeService.deleteRecipeItem(event, Number(id), requestId)

  return { success: true }
})