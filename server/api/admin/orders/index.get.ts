import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../utils/require-admin'
import { getOrCreateRequestId } from '../../../utils/request-id'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  await requireAdmin(event)

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data: orders, error } = await supabase
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
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_ERROR',
      data: {
        error: {
          code: 'INTERNAL_ERROR',
          message: `Error al consultar órdenes: ${error.message}`,
          request_id: requestId
        }
      }
    })
  }

  return {
    success: true,
    data: orders || []
  }
})
