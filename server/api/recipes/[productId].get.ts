import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Extraemos el ID del producto (pastel) de la URL
  const productId = getRouterParam(event, 'productId') || event.context.params?.productId || event.context.params?.id || event.context.params?.product_id;
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el ID del producto.' })
  }

  const supabase = await serverSupabaseClient<any>(event)

  // 2. Traemos los ingredientes de la receta uniendo (JOIN) con la tabla raw_materials
  const { data: items, error } = await supabase
    .from('recipe_items')
    .select(`
      id,
      quantity_used,
      raw_materials (
        id,
        name,
        unit,
        purchase_price,
        purchase_quantity
      )
    `)
    .eq('product_id', productId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Error al cargar la receta: ' + error.message })
  }

  // 3. Matemáticas financieras: calculamos el costo de cada gramo/caja gastado
  let totalCost = 0
  const enrichedItems = items?.map(item => {
    const mat = item.raw_materials
    // Costo unitario exacto del mercado
    const costPerUnit = (mat && mat.purchase_quantity > 0) 
      ? Number(mat.purchase_price) / Number(mat.purchase_quantity) 
      : 0
    
    // Costo total por este ingrediente en específico (ej. 200g * S/ 0.028)
    const itemCost = Number(item.quantity_used) * costPerUnit
    totalCost += itemCost

    return {
      id: item.id, // ID del registro en la receta (para poder borrarlo luego si nos equivocamos)
      raw_material_id: mat?.id,
      name: mat?.name || 'Insumo eliminado del almacén',
      unit: mat?.unit || '',
      quantity_used: Number(item.quantity_used),
      cost_per_unit: Number(costPerUnit.toFixed(6)),
      item_total_cost: Number(itemCost.toFixed(4))
    }
  }) || []

  // 4. Devolvemos la lista limpia y el costo total acumulado
  return {
    success: true,
    total_cost: Number(totalCost.toFixed(2)),
    data: enrichedItems
  }
})