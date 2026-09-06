import { defineEventHandler, getRouterParam, createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { isValidTrackingTokenFormat } from '../../../utils/crypto'
import type { PublicOrderTrackingDTO, PublicTrackingItem, PublicTimelineStep } from '~/types/tracking'

export type { PublicOrderTrackingDTO, PublicTrackingItem, PublicTimelineStep }

export default defineEventHandler(async (event): Promise<PublicOrderTrackingDTO> => {
  const token = getRouterParam(event, 'token')

  // 1. Validar formato estricto del token HMAC-SHA256 (64 hex lowercase)
  if (!token || !isValidTrackingTokenFormat(token)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'INVALID_TRACKING_TOKEN',
      data: {
        error: {
          code: 'INVALID_TRACKING_TOKEN',
          message: 'El token de seguimiento proporcionado tiene un formato inválido.'
        }
      }
    })
  }

  const supabase = serverSupabaseServiceRole<Database>(event)

  // 2. Consultar la orden por token único usando Service Role
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, customer_name, delivery_date, delivery_time, created_at, tracking_token')
    .eq('tracking_token', token)
    .maybeSingle()

  if (orderError || !order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'ORDER_NOT_FOUND',
      data: {
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'No se encontró ningún pedido asociado al enlace proporcionado.'
        }
      }
    })
  }

  // 3. Consultar los ítems de la orden y sus nombres de producto
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, products(name)')
    .eq('order_id', order.id)

  if (itemsError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_ERROR',
      data: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al consultar los ítems del pedido.'
        }
      }
    })
  }

  const items: PublicTrackingItem[] = (itemsData || []).map((it) => {
    // Type-safe mapping without 'any'
    const prod = it.products as { name?: string } | null
    return {
      name: prod?.name || 'Producto artesanal',
      quantity: it.quantity
    }
  })

  // 4. Sanitización de datos personales (Ley 29733 de Protección de Datos Personales)
  // Extrae únicamente el primer nombre para saludo personalizado, protegiendo apellidos, teléfono y dirección
  const fullName = order.customer_name ? order.customer_name.trim() : 'Cliente'
  const firstName = fullName.split(/\s+/)[0] || 'Cliente'

  // 5. Construcción de la línea de tiempo operativa
  const currentStatus = order.status || 'pending'
  const isCancelled = currentStatus === 'cancelled'

  const timeline: PublicTimelineStep[] = [
    {
      status: 'pending',
      label: 'Pedido Registrado',
      description: 'Tu orden fue recibida y confirmada por el sistema.',
      completed: true,
      current: currentStatus === 'pending'
    },
    {
      status: 'processing',
      label: 'En Taller / Horneado',
      description: 'Nuestros pasteleros están preparando las masas y horneando los bizcochos.',
      completed: ['processing', 'ready', 'delivered'].includes(currentStatus),
      current: currentStatus === 'processing'
    },
    {
      status: 'ready',
      label: 'Listo para Entrega',
      description: 'El pedido está decorado, empacado y listo para despacho o recojo.',
      completed: ['ready', 'delivered'].includes(currentStatus),
      current: currentStatus === 'ready'
    },
    {
      status: 'delivered',
      label: 'Entregado',
      description: '¡El pedido fue entregado! Disfruta tus postres Dulce Fe.',
      completed: currentStatus === 'delivered',
      current: currentStatus === 'delivered'
    }
  ]

  return {
    short_id: `#${order.id.slice(0, 8)}`,
    status: currentStatus,
    customer_first_name: firstName,
    channel: 'web_guest_tracking',
    delivery_date: order.delivery_date,
    delivery_time: order.delivery_time,
    created_at: order.created_at,
    items,
    timeline,
    is_cancelled: isCancelled
  }
})
