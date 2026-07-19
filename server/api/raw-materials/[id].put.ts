import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Extraemos el ID de la URL
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Falta el ID del insumo en la URL para poder actualizarlo.'
    })
  }

  // 2. Capturamos los datos nuevos
  const body = await readBody(event)
  const { name, unit, purchase_price, purchase_quantity, stock } = body

  // 3. Conectamos con Supabase
  const supabase = await serverSupabaseClient<any>(event)

  // 4. Actualizamos el insumo
  const { data, error } = await supabase
    .from('raw_materials')
    .update({ 
      name: name,
      unit: unit,
      purchase_price: purchase_price !== undefined ? Number(purchase_price) : undefined, 
      purchase_quantity: purchase_quantity !== undefined ? Number(purchase_quantity) : undefined,
      stock: stock !== undefined ? Number(stock) : undefined
    })
    .eq('id', id)
    .select()

  // 5. Manejo de errores
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al actualizar el insumo: ' + error.message
    })
  }

  // 6. Respuesta exitosa
  return {
    success: true,
    message: 'Insumo actualizado correctamente en el inventario.',
    data: data
  }
})
