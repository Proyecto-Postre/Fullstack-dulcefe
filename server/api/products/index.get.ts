import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Conectamos con el cliente de Supabase
  const supabase = await serverSupabaseClient(event)

  // 2. Hacemos la consulta: "Tráeme todas las columnas de la tabla products ordenadas por fecha"
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  // 3. Si algo falla en la base de datos, arrojamos error 500
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener el catálogo: ' + error.message
    })
  }

  // 4. Devolvemos el paquete listo para que el Frontend de Vue lo dibuje
  return {
    success: true,
    count: products?.length || 0,
    data: products
  }
})