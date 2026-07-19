import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, unit, purchase_price, purchase_quantity, stock } = body

  if (!name || !unit || !purchase_price || !purchase_quantity) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nombre, unidad, precio de compra y cantidad del paquete son obligatorios.'
    })
  }

  const supabase = await serverSupabaseClient<any>(event)

  const { data, error } = await supabase
    .from('raw_materials')
    .insert([
      {
        name: name,
        unit: unit,
        purchase_price: Number(purchase_price),
        purchase_quantity: Number(purchase_quantity),
        stock: Number(stock || 0)
      }
    ])
    .select()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al registrar el insumo: ' + error.message
    })
  }

  return {
    success: true,
    message: 'Insumo registrado correctamente en el almacén.',
    data: data
  }
})