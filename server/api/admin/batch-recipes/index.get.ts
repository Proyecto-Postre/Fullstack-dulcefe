import { getOrCreateRequestId } from '../../../utils/request-id'
import { BatchRecipeService } from '../../../services/batch-recipe.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const data = await BatchRecipeService.getBatchRecipes(event, requestId)
  return { success: true, data }
})
