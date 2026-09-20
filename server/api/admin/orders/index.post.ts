import { defineEventHandler, readBody, getHeader, createError, setResponseStatus } from 'h3'
import { getOrCreateRequestId } from '../../../utils/request-id'
import { AdminCreateOrderSchema } from '../../../utils/schemas/admin-order'
import { OrderService } from '../../../services/order.service'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)

  // 1. Validar cabecera obligatoria de idempotencia
  let idempotencyKey = getHeader(event, 'idempotency-key')
  if (!idempotencyKey || idempotencyKey.trim() === '') {
    // Si no la envía el cliente admin, generamos una automática para no romper UX manual
    idempotencyKey = crypto.randomUUID()
  }

  // 2. Validar cuerpo de la petición con Zod
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

  const parseResult = AdminCreateOrderSchema.safeParse(rawBody)
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
          message: 'Los datos del pedido administrativo no cumplen con el formato requerido.',
          request_id: requestId,
          details: formattedIssues
        }
      }
    })
  }

  const result = await OrderService.createAdminOrder(
    event,
    parseResult.data,
    idempotencyKey.trim(),
    requestId
  )

  setResponseStatus(event, 201)
  return result
})
