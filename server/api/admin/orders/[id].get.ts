import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireAdmin } from '../../../utils/require-admin'
import { getOrCreateRequestId } from '../../../utils/request-id'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  await requireAdmin(event)

  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
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

  const supabase = await getAdminSupabaseClient(event)

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles ( full_name, phone ),
      order_items (
        id,
        quantity,
        price_at_time,
        product_id,
        products ( name )
      )
    `)
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_ERROR',
      data: {
        error: {
          code: 'INTERNAL_ERROR',
          message: `Error al consultar la orden: ${error.message}`,
          request_id: requestId
        }
      }
    })
  }

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'NOT_FOUND',
      data: {
        error: {
          code: 'NOT_FOUND',
          message: `Orden con ID '${orderId}' no encontrada.`,
          request_id: requestId
        }
      }
    })
  }

  return {
    success: true,
    data: order
  }
})
