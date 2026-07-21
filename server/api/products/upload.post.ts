import { v2 as cloudinary } from 'cloudinary'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret
  })

  try {
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No se envió ningún archivo' })
    }

    // Buscar el archivo en la data (asumimos que el field name es "file")
    const file = formData.find(item => item.name === 'file' && item.filename)
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'Archivo inválido o corrupto' })
    }

    // Usar upload_stream ya que readMultipartFormData nos da un Buffer (file.data)
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'dulce_fe_products',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      )
      
      uploadStream.end(file.data)
    })

    return {
      success: true,
      url: (uploadResult as any).secure_url
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al subir imagen a Cloudinary: ' + error.message
    })
  }
})
