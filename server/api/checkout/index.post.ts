import { defineEventHandler, readBody, getHeader, createError, setResponseStatus } from 'h3'
import { getOrCreateRequestId } from '../../utils/request-id'
import { validateRequestOrigin } from '../../utils/http-origin'
import { CheckoutBodySchema } from '../../utils/schemas/checkout'
import { OrderService } from '../../services/order.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)

  // 1. Validar origen HTTP permitido
  validateRequestOrigin(event, requestId)

  // 2. Validar cabecera obligatoria de idempotencia
  const idempotencyKey = getHeader(event, 'idempotency-key')
  if (!idempotencyKey || idempotencyKey.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'IDEMPOTENCY_KEY_REQUIRED',
      data: {
        error: {
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message: 'La cabecera Idempotency-Key es obligatoria para procesar el checkout.',
          request_id: requestId
        }
      }
    })
  }

  // 3. Validar cuerpo de la petición con Zod
  const rawBody = await readBody(event).catch(() => null)
  if (!rawBody || typeof rawBody !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION_ERROR',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El cuerpo de la petición debe ser un objeto JSON válido.',
          request_id: requestId
        }
      }
    })
  }

  const parseResult = CheckoutBodySchema.safeParse(rawBody)
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
          message: 'Los datos del pedido no cumplen con el formato requerido.',
          request_id: requestId,
          details: formattedIssues
        }
      }
    })
  }

  // 4. Procesar la creación de la orden vía OrderService
  const result = await OrderService.createOrderFromCheckout(
    event,
    parseResult.data,
    idempotencyKey.trim(),
    requestId
  )

  setResponseStatus(event, 201)
  return result
})
