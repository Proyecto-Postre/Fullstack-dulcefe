import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { getOrCreateRequestId } from '../../../../utils/request-id'
import { AdminUpdateOrderStatusSchema } from '../../../../utils/schemas/admin-order'
import { OrderService } from '../../../../services/order.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const orderId = getRouterParam(event, 'id')

  if (!orderId || orderId.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El ID de la orden es obligatorio en la ruta.',
          request_id: requestId
        }
      }
    })
  }

  const rawBody = await readBody(event).catch(() => null)
  if (!rawBody || typeof rawBody !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION_ERROR',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El cuerpo de la petición debe ser un objeto JSON con el nuevo estado.',
          request_id: requestId
        }
      }
    })
  }

  const parseResult = AdminUpdateOrderStatusSchema.safeParse(rawBody)
  if (!parseResult.success) {
    const formattedIssues = parseResult.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }))

    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION_ERROR',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El estado proporcionado no es válido.',
          request_id: requestId,
          details: formattedIssues
        }
      }
    })
  }

  return await OrderService.updateOrderStatus(
    event,
    orderId.trim(),
    parseResult.data.status,
    requestId
  )
})
