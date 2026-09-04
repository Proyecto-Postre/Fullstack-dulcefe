import type { H3Event } from 'h3'
import { createError, getRequestIP, setResponseHeader } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import crypto from 'node:crypto'
import type { Database } from '~/types/database.types'
import type { CheckoutBodyDTO } from '../utils/schemas/checkout'
import { solesToCents, centsToSoles } from '../utils/money'

export interface OrderResponseItem {
  product_id: number
  name: string
  quantity: number
  price_at_time: string
}

export interface CheckoutResponseOrder {
  id: string
  status: string
  profile_id: string | null
  customer_name: string
  customer_phone: string | null
  address: string | null
  total_amount: string
  delivery_date: string | null
  delivery_time: string | null
  notes: string | null
  items: OrderResponseItem[]
}

export interface CheckoutResult {
  request_id: string
  order: CheckoutResponseOrder
}

/**
 * Servicio transaccional de órdenes de Dulce Fe.
 * Ejecuta con credenciales privilegiadas (Service Role) en el servidor Nitro.
 */
export class OrderService {
  /**
   * Crea un pedido público de checkout asegurando idempotencia, rate limit y precios del servidor.
   */
  static async createOrderFromCheckout(
    event: H3Event,
    dto: CheckoutBodyDTO,
    idempotencyKey: string,
    requestId: string
  ): Promise<CheckoutResult> {
    const supabase = serverSupabaseServiceRole<Database>(event)

    // 1. Detección de sesión (opcional para checkout público)
    let user = null
    try {
      user = await serverSupabaseUser(event)
    } catch {
      user = null
    }

    const principalScope = user ? `user:${user.id}` : 'guest'

    // 2. Rate Limit por IP (10 peticiones / 15 min)
    const clientIp = getRequestIP(event, { xForwardedFor: true }) || '0.0.0.0'
    const now = new Date()
    const windowStart = new Date(Math.floor(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000)).toISOString()

    try {
      const { data: rateRow, error: rateError } = await supabase
        .from('checkout_rate_windows' as any)
        .select('hit_count')
        .eq('ip', clientIp)
        .eq('window_start', windowStart)
        .maybeSingle()

      if (!rateError && rateRow && (rateRow as any).hit_count >= 10) {
        throw createError({
          statusCode: 429,
          statusMessage: 'RATE_LIMITED',
          data: {
            error: {
              code: 'RATE_LIMITED',
              message: 'Límite de solicitudes de checkout excedido. Intenta más tarde.',
              request_id: requestId
            }
          }
        })
      }

      // Incrementar o insertar ventana de rate limit
      if (rateRow) {
        await supabase
          .from('checkout_rate_windows' as any)
          .update({ hit_count: (rateRow as any).hit_count + 1 })
          .eq('ip', clientIp)
          .eq('window_start', windowStart)
      } else {
        await supabase
          .from('checkout_rate_windows' as any)
          .insert({ ip: clientIp, window_start: windowStart, hit_count: 1 })
      }
    } catch (err: unknown) {
      if ((err as { statusCode?: number })?.statusCode === 429) throw err
      // Si la tabla no está creada aún o falla la lectura de rate limit, continuamos de forma segura
    }

    // 3. Generar hash determinista del cuerpo validado
    const canonicalBody = JSON.stringify({
      channel: dto.channel,
      customer_name: dto.customer_name,
      customer_phone: dto.customer_phone || null,
      address: dto.address || null,
      delivery_date: dto.delivery_date || null,
      delivery_time: dto.delivery_time || null,
      items: [...dto.items].sort((a, b) => a.product_id - b.product_id)
    })
    const requestHash = crypto.createHash('sha256').update(canonicalBody).digest('hex')

    // 4. Reclamo de Idempotencia
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    const { data: existingKey, error: keySelectError } = await supabase
      .from('checkout_idempotency_keys' as any)
      .select('*')
      .eq('operation', 'checkout.create')
      .eq('principal_scope', principalScope)
      .eq('key', idempotencyKey)
      .maybeSingle()

    if (existingKey) {
      const row = existingKey as any
      if (row.request_hash !== requestHash) {
        throw createError({
          statusCode: 409,
          statusMessage: 'IDEMPOTENCY_KEY_REUSED',
          data: {
            error: {
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'La llave de idempotencia ya fue utilizada con un contenido diferente.',
              request_id: requestId
            }
          }
        })
      }

      if (row.lifecycle === 'processing') {
        setResponseHeader(event, 'Retry-After', 2)
        throw createError({
          statusCode: 409,
          statusMessage: 'IDEMPOTENCY_IN_PROGRESS',
          data: {
            error: {
              code: 'IDEMPOTENCY_IN_PROGRESS',
              message: 'La orden se encuentra en proceso de creación. Reintente en unos segundos.',
              request_id: requestId
            }
          }
        })
      }

      if (row.lifecycle === 'completed' && row.response_payload) {
        return {
          request_id: requestId,
          order: row.response_payload as CheckoutResponseOrder
        }
      }
    }

    // Registrar reclamo de la llave en estado 'processing'
    try {
      await supabase
        .from('checkout_idempotency_keys' as any)
        .insert({
          operation: 'checkout.create',
          principal_scope: principalScope,
          key: idempotencyKey,
          request_hash: requestHash,
          lifecycle: 'processing',
          status_code: 201,
          expires_at: expiresAt
        })
    } catch {
      // Conflicto de inserción simultánea concurrente
      setResponseHeader(event, 'Retry-After', 2)
      throw createError({
        statusCode: 409,
        statusMessage: 'IDEMPOTENCY_IN_PROGRESS',
        data: {
          error: {
            code: 'IDEMPOTENCY_IN_PROGRESS',
            message: 'Operación concurrente detectada en curso.',
            request_id: requestId
          }
        }
      })
    }

    // 5. Resolver productos oficiales desde la base de datos
    const productIds = dto.items.map(item => item.product_id)
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds)

    if (prodError || !dbProducts || dbProducts.length === 0) {
      throw createError({
        statusCode: 422,
        statusMessage: 'PRODUCT_NOT_FOUND',
        data: {
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Uno o más productos no fueron encontrados.',
            request_id: requestId
          }
        }
      })
    }

    const productMap = new Map<number, { id: number; name: string; price: number }>()
    for (const p of dbProducts) {
      if (p.price === null) {
        throw createError({
          statusCode: 422,
          statusMessage: 'PRODUCT_UNAVAILABLE',
          data: {
            error: {
              code: 'PRODUCT_UNAVAILABLE',
              message: `El producto ${p.name} no tiene precio asignado.`,
              request_id: requestId
            }
          }
        })
      }
      productMap.set(p.id, { id: p.id, name: p.name, price: p.price })
    }

    // 6. Aritmética monetaria exacta en céntimos (cero flotantes)
    let orderTotalCents = 0
    const orderItemsToInsert: {
      product_id: number
      quantity: number
      price_at_time: number
      name: string
      priceString: string
    }[] = []

    for (const item of dto.items) {
      const dbProduct = productMap.get(item.product_id)
      if (!dbProduct) {
        throw createError({
          statusCode: 422,
          statusMessage: 'PRODUCT_NOT_FOUND',
          data: {
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: `El producto con ID ${item.product_id} no existe.`,
              request_id: requestId
            }
          }
        })
      }

      const unitPriceCents = solesToCents(dbProduct.price)
      const lineTotalCents = unitPriceCents * item.quantity
      orderTotalCents += lineTotalCents

      orderItemsToInsert.push({
        product_id: dbProduct.id,
        quantity: item.quantity,
        price_at_time: parseFloat(centsToSoles(unitPriceCents)),
        name: dbProduct.name,
        priceString: centsToSoles(unitPriceCents)
      })
    }

    const totalAmountString = centsToSoles(orderTotalCents)

    // 7. Inserción de orden y detalle
    try {
      const { data: createdOrder, error: orderInsertError } = await supabase
        .from('orders')
        .insert({
          profile_id: user ? user.id : null,
          customer_name: dto.customer_name,
          customer_phone: dto.customer_phone || null,
          address: dto.address || null,
          total_amount: parseFloat(totalAmountString),
          status: 'pending',
          delivery_date: dto.delivery_date || null,
          delivery_time: dto.delivery_time || null,
          notes: dto.notes || null
        })
        .select()
        .single()

      if (orderInsertError || !createdOrder) {
        throw orderInsertError || new Error('No se pudo crear la cabecera de la orden')
      }

      const itemsPayload = orderItemsToInsert.map(it => ({
        order_id: createdOrder.id,
        product_id: it.product_id,
        quantity: it.quantity,
        price_at_time: it.price_at_time
      }))

      const { error: itemsInsertError } = await supabase
        .from('order_items')
        .insert(itemsPayload)

      if (itemsInsertError) {
        // En caso de fallo, intentamos limpiar la orden huérfana
        await supabase.from('orders').delete().eq('id', createdOrder.id)
        throw itemsInsertError
      }

      // Si el cliente autenticado envió teléfono y su perfil no lo tenía, actualizarlo
      if (user && dto.customer_phone) {
        await supabase
          .from('profiles')
          .update({ phone: dto.customer_phone })
          .eq('id', user.id)
          .is('phone', null)
      }

      const responseOrder: CheckoutResponseOrder = {
        id: createdOrder.id,
        status: createdOrder.status || 'pending',
        profile_id: createdOrder.profile_id,
        customer_name: createdOrder.customer_name || dto.customer_name,
        customer_phone: createdOrder.customer_phone,
        address: createdOrder.address,
        total_amount: totalAmountString,
        delivery_date: createdOrder.delivery_date,
        delivery_time: createdOrder.delivery_time,
        notes: createdOrder.notes,
        items: orderItemsToInsert.map(it => ({
          product_id: it.product_id,
          name: it.name,
          quantity: it.quantity,
          price_at_time: it.priceString
        }))
      }

      // 8. Marcar la llave de idempotencia como completada
      await supabase
        .from('checkout_idempotency_keys' as any)
        .update({
          lifecycle: 'completed',
          order_id: createdOrder.id,
          response_payload: responseOrder
        })
        .eq('operation', 'checkout.create')
        .eq('principal_scope', principalScope)
        .eq('key', idempotencyKey)

      // 9. Registrar auditoría sin PII
      await supabase
        .from('audit_events' as any)
        .insert({
          actor_id: user ? user.id : null,
          action: 'checkout.create',
          entity: 'orders',
          entity_id: createdOrder.id,
          result: 'ok',
          request_id: requestId
        })

      return {
        request_id: requestId,
        order: responseOrder
      }
    } catch (dbErr: unknown) {
      // Si falló, eliminar la llave en estado 'processing' para permitir reintento limpio
      await supabase
        .from('checkout_idempotency_keys' as any)
        .delete()
        .eq('operation', 'checkout.create')
        .eq('principal_scope', principalScope)
        .eq('key', idempotencyKey)
        .eq('lifecycle', 'processing')

      const msg = dbErr instanceof Error ? dbErr.message : 'Error inesperado al persistir orden'
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: msg,
            request_id: requestId
          }
        }
      })
    }
  }
}
