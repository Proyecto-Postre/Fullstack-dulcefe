import { getOrCreateRequestId } from '../../../utils/request-id'
import { BatchRecipeService } from '../../../services/batch-recipe.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const body = await readBody(event)

  const data = await BatchRecipeService.quickDeductPieces(event, body, requestId)
  return { success: true, data }
})
