import { getOrCreateRequestId } from '../../../utils/request-id'
import { BatchRecipeService } from '../../../services/batch-recipe.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de tanda inválido.' })
  }

  const body = await readBody(event)
  const data = await BatchRecipeService.updateBatchRecipe(event, id, body, requestId)
  return { success: true, data }
})
