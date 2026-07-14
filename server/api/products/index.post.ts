import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Capturamos el JSON que envías en el Body de Postman
  const body = await readBody(event)
  const { name, price, stock, image_url } = body

  // 2. Validación básica: no podemos crear un pastel sin nombre ni precio
  if (!name || !price) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El nombre y el precio del producto son obligatorios.'
    })
  }

  // 3. Conectamos con la base de datos en la nube
  const supabase = await serverSupabaseClient<any>(event)

  // 4. Insertamos la fila en la tabla 'products' de Supabase
  const { data, error } = await supabase
    .from('products')
    .insert([
      { 
        name: name, 
        price: Number(price), 
        stock: Number(stock || 0), 
        image_url: image_url || null 
      }
    ])
    .select() // Le pedimos a Supabase que nos devuelva el producto recién guardado con su ID

  // 5. Si algo falla al insertar, arrojamos error
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al crear el producto: ' + error.message
    })
  }

  // 6. Respondemos con éxito y devolvemos el pastel guardado
  return {
    success: true,
    message: 'Producto creado exitosamente en el catálogo de Dulce Fe',
    data: data
  }
})