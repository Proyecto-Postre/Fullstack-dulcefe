import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB estricto según §19 PR-1d

export default defineEventHandler(async (event) => {
  // 🔒 1. Autorización de Administrador (401 si no hay sesión, 403 si no es admin)
  await requireAdmin(event)

  try {
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'No se envió ningún archivo en la petición.'
          }
        }
      })
    }

    const file = formData.find(item => item.name === 'file' && item.filename)
    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          error: {
            code: 'INVALID_FILE',
            message: 'El archivo adjunto es inválido o está vacío.'
          }
        }
      })
    }

    // 🔒 2. Validación de Tamaño (Tope 2 MB)
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'El archivo excede el tamaño máximo permitido de 2 MB.'
          }
        }
      })
    }

    // 🔒 3. Validación de Magic Bytes (Cero confianza en la extensión del cliente)
    const validation = validateImageBuffer(file.data)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          error: {
            code: validation.code,
            message: validation.error
          }
        }
      })
    }

    // 🔒 4. Ruta Segura con UUIDv4 (Previene Path Traversal y Colisiones)
    const fileName = `products/${crypto.randomUUID()}.${validation.ext}`

    // 5. Subida a Supabase Storage (Bucket product_images)
    const supabase = await serverSupabaseClient<Database>(event)
    const { error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(fileName, file.data, {
        contentType: validation.mime,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          error: {
            code: 'STORAGE_UPLOAD_ERROR',
            message: 'Error al almacenar la imagen en Supabase: ' + uploadError.message
          }
        }
      })
    }

    // 6. Obtener URL pública permanente
    const { data: { publicUrl } } = supabase.storage
      .from('product_images')
      .getPublicUrl(fileName)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Error interno al procesar la imagen'
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        error: {
          code: 'INTERNAL_ERROR',
          message: message
        }
      }
    })
  }
})
