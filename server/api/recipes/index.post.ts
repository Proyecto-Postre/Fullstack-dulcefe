import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  // 🔒 Validación de privilegios de administrador (Fase 1 - PR-1b)
  await requireAdmin(event)

  const body = await readBody(event)
  const { product_id, raw_material_id, quantity_used } = body

  if (!product_id || !raw_material_id || !quantity_used) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'El producto, el insumo y la cantidad utilizada son obligatorios.' 
    })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('recipe_items')
    .insert([{
      product_id: Number(product_id),
      raw_material_id: Number(raw_material_id),
      quantity_used: Number(quantity_used)
    }])
    .select()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Error al agregar insumo a la receta: ' + error.message })
  }

  return { success: true, data: data }
})