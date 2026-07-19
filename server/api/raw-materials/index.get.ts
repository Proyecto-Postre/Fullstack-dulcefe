import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<any>(event)

  const { data: rawMaterials, error } = await supabase
    .from('raw_materials')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener inventario de insumos: ' + error.message
    })
  }

  // Enriquecemos los datos calculando el costo unitario exacto (S/ por gramo/ml/und)
  const enrichedData = rawMaterials?.map(item => {
    const costPerUnit = item.purchase_quantity > 0 
      ? Number(item.purchase_price) / Number(item.purchase_quantity) 
      : 0

    return {
      ...item,
      cost_per_unit: Number(costPerUnit.toFixed(6)) // 6 decimales para precisión en micro-gramos
    }
  })

  return {
    success: true,
    data: enrichedData
  }
})