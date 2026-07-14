import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Obtenemos la URL y el verbo HTTP de la petición que está entrando
  const url = getRequestURL(event)
  const method = event.method

  // 2. Definimos qué rutas son zonas restringidas
  // Por ejemplo: Si intentan modificar la tabla de productos (POST, PUT, DELETE) o entrar al admin
  const isModifyingProducts = url.pathname.startsWith('/api/products') && ['POST', 'PUT', 'DELETE'].includes(method)
  const isAdminRoute = url.pathname.startsWith('/api/admin')

  // 3. Si la petición intenta tocar una zona restringida, activamos la aduana
  if (isModifyingProducts || isAdminRoute) {
    // Le preguntamos a Supabase en silencio si el usuario mandó un Token JWT válido
    const user = await serverSupabaseUser(event)

    // Si no hay token o es inválido, le cerramos la puerta en la cara (Error 401)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Acceso denegado: Necesitas iniciar sesión como administrador para modificar el catálogo.'
      })
    }
  }

  // Si es un simple GET para ver productos, el middleware no hace nada y lo deja pasar libremente.
})