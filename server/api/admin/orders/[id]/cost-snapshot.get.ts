import { defineEventHandler, createError, getRouterParam } from 'h3'
import { requireAdmin } from '../../../../utils/require-admin'
import { getOrCreateRequestId } from '../../../../utils/request-id'
import { OrderService } from '../../../../services/order.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  await requireAdmin(event)

  const orderId = getRouterParam(event, 'id')
  if (!orderId || orderId.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'BAD_REQUEST',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El ID de la orden es obligatorio.',
          request_id: requestId
        }
      }
    })
  }

  const snapshot = await OrderService.freezeOrderCostSnapshot(event, orderId, requestId)
  if (!snapshot) {
    throw createError({
      statusCode: 404,
      statusMessage: 'NOT_FOUND',
      data: {
        error: {
          code: 'ORDER_NOT_FOUND',
          message: `La orden '${orderId}' no fue encontrada.`,
          request_id: requestId
        }
      }
    })
  }

  return {
    success: true,
    data: snapshot
  }
})
