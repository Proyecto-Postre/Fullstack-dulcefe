import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { getOrCreateRequestId } from '../../../../utils/request-id'
import { OrderService } from '../../../../services/order.service'

const VerifyPaymentBodySchema = z.object({
  action: z.enum(['verify', 'reject'], {
    message: "La acción debe ser 'verify' o 'reject'"
  }),
  notes: z.string().trim().max(300, 'Las notas no pueden exceder 300 caracteres').optional()
})

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
          message: 'El ID de la orden es obligatorio.',
          request_id: requestId
        }
      }
    })
  }

  const rawBody = await readBody(event).catch(() => null)
  const parseResult = VerifyPaymentBodySchema.safeParse(rawBody)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION_ERROR',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los parámetros de verificación de pago son inválidos.',
          details: parseResult.error.issues,
          request_id: requestId
        }
      }
    })
  }

  return await OrderService.verifyPayment(
    event,
    orderId,
    parseResult.data.action,
    parseResult.data.notes,
    requestId
  )
})
