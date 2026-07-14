import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Capturamos el JSON que viene desde Postman o el Frontend
  const body = await readBody(event)
  const { email, password, username } = body

  // 2. Validación básica de seguridad
  if (!email || !password || !username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Faltan datos obligatorios: email, password y username son requeridos.'
    })
  }

  // 3. Conectamos con el cliente nativo de Supabase en el servidor
  const supabase = await serverSupabaseClient(event)

  // 4. Le decimos a Supabase que registre al usuario en su motor seguro
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      // Aquí podemos guardar datos extra del perfil del usuario (como su nombre o rol)
      data: {
        username: username,
        role: 'ADMIN'
      }
    }
  })

  // 5. Si Supabase rechaza el registro (ej: correo repetido o clave muy corta), arrojamos error
  if (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }

  // 6. Si todo sale perfecto, devolvemos los datos limpios del nuevo usuario
  return {
    success: true,
    message: 'Usuario registrado exitosamente en el ecosistema Dulce Fe',
    user: {
      id: data.user?.id,
      email: data.user?.email,
      username: data.user?.user_metadata?.username,
      role: data.user?.user_metadata?.role
    }
  }
})