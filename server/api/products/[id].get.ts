import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Capturamos el ID de la URL
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Se requiere el ID del producto en la URL.'
    })
  }

  // 2. Conectamos con Supabase
  const supabase = await serverSupabaseClient<any>(event)

  // 3. Consultamos un solo producto que coincida con el ID
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single() // .single() le dice a Postgres que devuelva un solo objeto { ... } en vez de una lista [ { ... } ]

  // 4. Si no existe en la base de datos, mandamos un 404 (No encontrado)
  if (error) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Producto no encontrado en Dulce Fe.'
    })
  }

  // 5. Devolvemos el pastel
  return {
    success: true,
    data: data
  }
})