import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { validateImageBuffer } from '../../utils/image-validator'
import { getOrCreateRequestId } from '../../utils/request-id'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)

  try {
    const supabase = await getAdminSupabaseClient(event)
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'BAD_REQUEST',
        data: {
          error: {
            code: 'MISSING_FILE',
            message: 'No se envió ningún archivo de comprobante en el formulario.',
            request_id: requestId
          }
        }
      })
    }

    const file = formData.find((item) => item.name === 'file' && item.filename)
    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'BAD_REQUEST',
        data: {
          error: {
            code: 'INVALID_FILE',
            message: 'El campo file no contiene datos binarios válidos.',
            request_id: requestId
          }
        }
      })
    }

    // Validación por Magic Bytes y tamaño máximo de 2 MB
    const validation = validateImageBuffer(file.data, file.data.length)
    if (!validation.valid || !validation.extension || !validation.mimeType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'BAD_REQUEST',
        data: {
          error: {
            code: validation.error?.code || 'INVALID_IMAGE',
            message: validation.error?.message || 'El comprobante enviado no es una imagen válida (JPEG, PNG, WebP).',
            request_id: requestId
          }
        }
      })
    }

    // Generar un nombre único seguro
    const fileName = `voucher-${randomUUID()}.${validation.extension}`

    // Subir a Supabase Storage en el bucket payment-receipts
    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(fileName, file.data, {
        contentType: validation.mimeType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'STORAGE_UPLOAD_ERROR',
            message: `Error al almacenar el comprobante: ${uploadError.message}`,
            request_id: requestId
          }
        }
      })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(fileName)

    return {
      success: true,
      url: publicUrl,
      fileName
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Error interno al procesar el comprobante'
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_ERROR',
      data: {
        error: {
          code: 'INTERNAL_ERROR',
          message,
          request_id: requestId
        }
      }
    })
  }
})
