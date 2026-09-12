import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../utils/require-admin'
import { getOrCreateRequestId } from '../../../utils/request-id'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  const adminUser = await requireAdmin(event)

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

  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION_ERROR',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El cuerpo de la petición debe ser un objeto JSON.',
          request_id: requestId
        }
      }
    })
  }

  const supabase = await getAdminSupabaseClient(event)

  // Consultar orden existente
  const { data: existingOrder, error: fetchErr } = await supabase
    .from('orders')
    .select('*, profiles(id, full_name, phone)')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchErr || !existingOrder) {
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

  const newName = body.customer_name !== undefined ? body.customer_name : body.full_name
  const newPhone = body.customer_phone !== undefined ? body.customer_phone : body.phone

  const updatePayload: Database['public']['Tables']['orders']['Update'] = {}
  if (newName !== undefined) updatePayload.customer_name = typeof newName === 'string' ? newName.trim() : null
  if (newPhone !== undefined) updatePayload.customer_phone = typeof newPhone === 'string' ? newPhone.trim() : null
  if (body.delivery_date !== undefined) updatePayload.delivery_date = body.delivery_date || null
  if (body.delivery_time !== undefined) updatePayload.delivery_time = body.delivery_time || null
  if (body.notes !== undefined) updatePayload.notes = typeof body.notes === 'string' ? body.notes.trim() : null

  const { data: updatedOrder, error: updateErr } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select()
    .single()

  if (updateErr || !updatedOrder) {
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_ERROR',
      data: {
        error: {
          code: 'INTERNAL_ERROR',
          message: `Error al actualizar la orden: ${updateErr?.message}`,
          request_id: requestId
        }
      }
    })
  }

  // Si tiene un perfil asociado y se editaron nombre o teléfono, sincronizar perfil
  if (existingOrder.profile_id && (body.full_name !== undefined || body.phone !== undefined || body.customer_name !== undefined || body.customer_phone !== undefined)) {
    const profileUpdate: Database['public']['Tables']['profiles']['Update'] = {}
    const newName = body.full_name || body.customer_name
    const newPhone = body.phone || body.customer_phone
    if (newName) profileUpdate.full_name = newName.trim()
    if (newPhone) profileUpdate.phone = newPhone.trim()

    if (Object.keys(profileUpdate).length > 0) {
      await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', existingOrder.profile_id)
    }
  }

  // Registrar auditoría
  await supabase.from('audit_events').insert({
    actor_id: adminUser.user.id,
    action: 'order.status',
    entity: 'orders',
    entity_id: orderId,
    result: 'ok',
    request_id: requestId
  })

  return {
    success: true,
    data: updatedOrder
  }
})
