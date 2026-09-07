export default defineEventHandler(async (event) => {
  // 🔒 Validación de privilegios de administrador (Fase 1 - PR-1b)
  await requireAdmin(event)

  const supabase = await getAdminSupabaseClient(event)

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

  // Dividimos el precio total entre la cantidad del paquete para obtener el costo exacto por gramo/ml/und
  const enrichedData = rawMaterials?.map(item => {
    const qty = item.purchase_quantity ?? 0
    const price = item.purchase_price ?? 0
    const costPerUnit = qty > 0 
      ? Number(price) / Number(qty) 
      : 0

    return {
      ...item,
      cost_per_unit: Number(costPerUnit.toFixed(6))
    }
  })

  return {
    success: true,
    data: enrichedData
  }
})