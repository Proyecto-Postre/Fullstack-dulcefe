import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No se envió ningún archivo' })
    }

    const file = formData.find(item => item.name === 'file' && item.filename)
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'Archivo inválido o corrupto' })
    }

    // Generar un nombre único para el archivo
    const fileExt = file.filename?.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${fileName}`

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('product_images')
      .upload(filePath, file.data, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Error al subir a Supabase: ' + error.message })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product_images')
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error interno al subir imagen'
    })
  }
})
