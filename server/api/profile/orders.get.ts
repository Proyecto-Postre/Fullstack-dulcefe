import { defineEventHandler, createError } from 'h3'
import { requireUser } from '../../utils/require-user'
import { getAdminSupabaseClient } from '../../utils/server-supabase'
import type { ProfileOrder } from '~/types/profile'

export default defineEventHandler(async (event) => {
  // 1. Requerir usuario autenticado en la sesión de Supabase
  const user = await requireUser(event)
  const userId = user.id || (user as unknown as { sub?: string }).sub || ''

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Se requiere iniciar sesión para consultar tus pedidos.'
        }
      }
    })
  }

  // 2. Obtener cliente Supabase privilegiado de servidor
  const supabase = await getAdminSupabaseClient(event)

  // 3. Consultar el perfil del usuario para obtener su teléfono (y auto-vincular pedidos huérfanos)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, phone')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.phone) {
    const cleanDigits = profile.phone.replace(/\D/g, '')
    const phone9 = (cleanDigits.startsWith('51') && cleanDigits.length === 11) ? cleanDigits.slice(2) : cleanDigits
    if (phone9 && phone9.length === 9) {
      // Auto-vincular pedidos realizados como invitado con este número telefónico
      await supabase
        .from('orders')
        .update({ profile_id: userId })
        .is('profile_id', null)
        .or(`customer_phone.eq.${phone9},customer_phone.eq.+51${phone9}`)
    }
  }

  // 4. Obtener todos los pedidos asociados a este cliente con sus productos
  const { data: orders, error: dbError } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      status,
      total_amount,
      delivery_date,
      delivery_time,
      notes,
      address,
      tracking_token,
      order_items (
        id,
        product_id,
        quantity,
        price_at_time,
        products (
          id,
          name,
          price,
          image_url
        )
      )
    `)
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })

  if (dbError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        error: {
          code: 'ORDERS_FETCH_FAILED',
          message: 'Error al consultar el historial de pedidos.'
        }
      }
    })
  }

  return {
    success: true,
    data: (orders as unknown as ProfileOrder[]) || []
  }
})
