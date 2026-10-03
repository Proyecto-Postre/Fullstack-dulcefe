import { getOrCreateRequestId } from '../../../utils/request-id'
import { BatchRecipeService } from '../../../services/batch-recipe.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  return await BatchRecipeService.getAtRiskProducts(event, requestId)
})
