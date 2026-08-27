import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  // 🔒 Validación de privilegios de administrador (Fase 1 - PR-1b)
  await requireAdmin(event)

  // 1. Extraemos el ID de la URL (lo que reemplaza al [id] en el enlace)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Falta el ID del producto en la URL para poder actualizarlo.'
    })
  }

  // 2. Capturamos los datos nuevos que mandaste en el Body desde Postman
  const body = await readBody(event)
  const { name, price, stock, image_url } = body

  // 3. Conectamos con Supabase
  const supabase = await serverSupabaseClient<Database>(event)

  // 4. Le decimos a Supabase: "Actualiza este producto DONDE (.eq) el id sea igual al de la URL"
  const { data, error } = await supabase
    .from('products')
    .update({ 
      name: name, 
      price: price !== undefined ? Number(price) : undefined, 
      stock: stock !== undefined ? Number(stock) : undefined, 
      image_url: image_url
    })
    .eq('id', Number(id))
    .select()

  // 5. Si algo falla en la nube, lanzamos error
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al actualizar el producto: ' + error.message
    })
  }

  // 6. Respondemos con el producto ya modificado
  return {
    success: true,
    message: 'Producto actualizado correctamente en Dulce Fe',
    data: data
  }
})