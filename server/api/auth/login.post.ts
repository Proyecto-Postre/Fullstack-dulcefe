import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Capturamos las credenciales que envía el usuario
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El correo y la contraseña son obligatorios para iniciar sesión.'
    })
  }

  // 2. Conectamos con la aduana de Supabase
  const supabase = await serverSupabaseClient(event)

  // 3. Intentamos iniciar sesión con contraseña
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })

  // 4. Si la contraseña está mal o el usuario no existe, rechazamos el paso
  if (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas: ' + error.message
    })
  }

  // 5. Si todo es correcto, Supabase ya gestionó las cookies de sesión automáticamente en segundo plano
  return {
    success: true,
    message: 'Sesión iniciada correctamente',
    user: {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username,
      role: data.user.user_metadata?.role
    },
    // Supabase nos entrega el Token JWT listo para usar si lo necesitamos en el front
    accessToken: data.session.access_token
  }
})