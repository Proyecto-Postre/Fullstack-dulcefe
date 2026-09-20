import { serverSupabaseClient } from '#supabase/server'
import { randomUUID } from 'node:crypto'
import type { Database } from '~/types/database.types'
import { validateImageBuffer } from '../../utils/image-validator'

export default defineEventHandler(async (event) => {
  // 1. 🔒 Validación de privilegios de administrador (Fase 1 - PR-1b)
  await requireAdmin(event)

  try {
    const supabase = await serverSupabaseClient<Database>(event)
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          error: {
            code: 'MISSING_FILE',
            message: 'No se envió ningún archivo en el formulario multipart.'
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
            message: 'El campo file no contiene datos válidos.'
          }
        }
      })
    }

    // 2. 🛡️ Validación estricta por Magic Bytes y tamaño máximo de 2 MB (Fase 1 - PR-1d)
    const validation = validateImageBuffer(file.data, file.data.length)
    if (!validation.valid || !validation.extension || !validation.mimeType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          error: validation.error || {
            code: 'INVALID_IMAGE',
            message: 'El archivo enviado no es una imagen válida o está dañado.'
          }
        }
      })
    }

    // 3. Generar un nombre único e impredecible usando UUIDv4 para prevenir colisiones y directory traversal
    const fileName = `${randomUUID()}.${validation.extension}`
    const filePath = `${fileName}`

    // 4. Subir a Supabase Storage con Content-Type canónico
    const { error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(filePath, file.data, {
        contentType: validation.mimeType,
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
            message: `Error al almacenar la imagen en Supabase Storage: ${uploadError.message}`
          }
        }
      })
    }

    // 5. Obtener URL pública oficial
    const { data: { publicUrl } } = supabase.storage
      .from('product_images')
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Error interno al procesar la subida de imagen'
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        error: {
          code: 'IMAGE_UPLOAD_EXCEPTION',
          message
        }
      }
    })
  }
})
