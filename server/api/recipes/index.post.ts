import { getOrCreateRequestId } from '../../utils/request-id'
import { RecipeService } from '../../services/recipe.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)

  const body = await readBody(event)
  const { product_id, raw_material_id, quantity_used } = body || {}

  if (!product_id || !raw_material_id || !quantity_used) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'El producto, el insumo y la cantidad utilizada son obligatorios.' 
    })
  }

  const data = await RecipeService.saveRecipeItem(
    event,
    {
      product_id: Number(product_id),
      raw_material_id: Number(raw_material_id),
      quantity_used: Number(quantity_used)
    },
    requestId
  )

  return { success: true, data: [data] }
})