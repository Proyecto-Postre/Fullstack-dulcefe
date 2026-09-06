import type { H3Event } from 'h3'
import { createError, getRequestIP, setResponseHeader } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import crypto from 'node:crypto'
import type { Database } from '~/types/database.types'
import type { CheckoutBodyDTO } from '../utils/schemas/checkout'
import type { AdminCreateOrderInput } from '../utils/schemas/admin-order'
import { solesToCents, centsToSoles, calculateLoyaltyPoints } from '../utils/money'
import { requireAdmin } from '../utils/require-admin'

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
        .from('checkout_rate_windows')
        .select('hit_count')
        .eq('ip', clientIp)
        .eq('window_start', windowStart)
        .maybeSingle()

      if (!rateError && rateRow && rateRow.hit_count >= 10) {
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
          .from('checkout_rate_windows')
          .update({ hit_count: rateRow.hit_count + 1 })
          .eq('ip', clientIp)
          .eq('window_start', windowStart)
      } else {
        await supabase
          .from('checkout_rate_windows')
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
    const { data: existingKey } = await supabase
      .from('checkout_idempotency_keys')
      .select('*')
      .eq('operation', 'checkout.create')
      .eq('principal_scope', principalScope)
      .eq('key', idempotencyKey)
      .maybeSingle()

    if (existingKey) {
      const row = existingKey
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
          order: row.response_payload as unknown as CheckoutResponseOrder
        }
      }
    }

    // Registrar reclamo de la llave en estado 'processing'
    try {
      await supabase
        .from('checkout_idempotency_keys')
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
        .from('checkout_idempotency_keys')
        .update({
          lifecycle: 'completed',
          order_id: createdOrder.id,
          response_payload: responseOrder as unknown as Database['public']['Tables']['checkout_idempotency_keys']['Update']['response_payload']
        })
        .eq('operation', 'checkout.create')
        .eq('principal_scope', principalScope)
        .eq('key', idempotencyKey)

      // 9. Registrar auditoría sin PII
      await supabase
        .from('audit_events')
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
        .from('checkout_idempotency_keys')
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

  /**
   * Actualiza el estado de una orden aplicando matriz de transiciones permitidas,
   * quiebre de stock al pasar a 'processing' y acumulación de puntos al pasar a 'completed'.
   */
  static async updateOrderStatus(
    event: H3Event,
    orderId: string,
    newStatus: string,
    requestId: string
  ) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    // 1. Consultar orden existente junto a sus ítems
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle()

    if (orderErr || !order) {
      throw createError({
        statusCode: 404,
        statusMessage: 'NOT_FOUND',
        data: {
          error: {
            code: 'NOT_FOUND',
            message: `La orden con ID '${orderId}' no fue encontrada.`,
            request_id: requestId
          }
        }
      })
    }

    const oldStatus = order.status || 'pending'

    // Si el estado es idéntico, es un no-op idempotente
    if (oldStatus === newStatus) {
      return {
        request_id: requestId,
        order_id: orderId,
        from: oldStatus,
        to: newStatus,
        inventory_processed: order.inventory_processed ?? false,
        points_awarded: order.points_awarded ?? false
      }
    }

    // 2. Validar matriz de transiciones (§7.3)
    const allowedTransitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['ready', 'cancelled'],
      ready: ['completed', 'cancelled'],
      completed: [], // terminal
      cancelled: []  // terminal
    }

    const allowedNext = allowedTransitions[oldStatus] || []
    if (!allowedNext.includes(newStatus)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'FORBIDDEN_TRANSITION',
        data: {
          error: {
            code: 'FORBIDDEN_TRANSITION',
            message: `Transición no permitida: no se puede cambiar una orden de '${oldStatus}' a '${newStatus}'.`,
            request_id: requestId
          }
        }
      })
    }

    let inventoryProcessed = order.inventory_processed ?? false
    let pointsAwarded = order.points_awarded ?? false

    // 3. Transición a 'processing': Quiebre y descuento de insumos
    if (newStatus === 'processing' && !inventoryProcessed) {
      const orderItems = (order.order_items as Array<{ product_id: number; quantity: number }>) || []

      if (orderItems.length > 0) {
        const productIds = orderItems.map(it => it.product_id)

        // Consultar recetas vigentes
        const { data: recipeItems, error: recipeErr } = await supabase
          .from('recipe_items')
          .select('product_id, raw_material_id, quantity_used')
          .in('product_id', productIds)

        if (recipeErr) {
          throw createError({
            statusCode: 500,
            statusMessage: 'INTERNAL_ERROR',
            data: {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Error al consultar recetas para descontar insumos.',
                request_id: requestId
              }
            }
          })
        }

        if (recipeItems && recipeItems.length > 0) {
          // Calcular insumos necesarios agrupados
          const neededMap = new Map<number, number>()
          for (const item of orderItems) {
            const recipes = recipeItems.filter(r => r.product_id === item.product_id)
            for (const rec of recipes) {
              const qtyPerUnit = Number(rec.quantity_used ?? 0)
              const current = neededMap.get(rec.raw_material_id) || 0
              neededMap.set(rec.raw_material_id, current + (qtyPerUnit * item.quantity))
            }
          }

          if (neededMap.size > 0) {
            const materialIds = Array.from(neededMap.keys())
            const { data: materials, error: matErr } = await supabase
              .from('raw_materials')
              .select('id, name, stock, unit')
              .in('id', materialIds)

            if (matErr || !materials) {
              throw createError({
                statusCode: 500,
                statusMessage: 'INTERNAL_ERROR',
                data: {
                  error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Error al consultar stock de materias primas.',
                    request_id: requestId
                  }
                }
              })
            }

            // Verificar suficiencia de stock (Quiebre)
            for (const mat of materials) {
              const needed = neededMap.get(mat.id) || 0
              const currentStock = Number(mat.stock)
              if (currentStock < needed) {
                throw createError({
                  statusCode: 409,
                  statusMessage: 'INSUFFICIENT_STOCK',
                  data: {
                    error: {
                      code: 'INSUFFICIENT_STOCK',
                      message: `Stock insuficiente del insumo '${mat.name}'. Disponible: ${currentStock} ${mat.unit}, Requerido: ${needed} ${mat.unit}.`,
                      request_id: requestId,
                      details: {
                        material_id: mat.id,
                        name: mat.name,
                        have: currentStock,
                        need: needed,
                        unit: mat.unit
                      }
                    }
                  }
                })
              }
            }

            // Descontar insumos y registrar en el libro de inventario
            for (const mat of materials) {
              const needed = neededMap.get(mat.id) || 0
              const stockBefore = Number(mat.stock)
              const stockAfter = stockBefore - needed

              // Registrar en inventory_movements
              await supabase
                .from('inventory_movements')
                .insert({
                  raw_material_id: mat.id,
                  order_id: orderId,
                  type: 'order_consumption',
                  quantity_delta: -needed,
                  stock_before: stockBefore,
                  stock_after: stockAfter,
                  reason: `Consumo por orden ${orderId}`,
                  actor_id: adminUser.user.id,
                  request_id: requestId
                })

              // Actualizar stock oficial del insumo
              await supabase
                .from('raw_materials')
                .update({ stock: stockAfter })
                .eq('id', mat.id)
            }

            inventoryProcessed = true
          }
        } else {
          // Productos sin receta no bloquean
          inventoryProcessed = true
        }
      }
    }

    // 4. Transición a 'completed': Otorgamiento de puntos de lealtad
    if (newStatus === 'completed' && !pointsAwarded && order.profile_id) {
      const orderTotalCents = solesToCents(order.total_amount ?? 0)
      const pointsToAward = calculateLoyaltyPoints(orderTotalCents)

      if (pointsToAward > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', order.profile_id)
          .maybeSingle()

        const currentPoints = profile?.points ? Number(profile.points) : 0
        await supabase
          .from('profiles')
          .update({ points: currentPoints + pointsToAward })
          .eq('id', order.profile_id)

        pointsAwarded = true
      }
    }

    // 5. Actualizar orden
    const updateFields: Database['public']['Tables']['orders']['Update'] = { status: newStatus }
    if (inventoryProcessed !== (order.inventory_processed ?? false)) {
      updateFields.inventory_processed = inventoryProcessed
    }
    if (pointsAwarded !== (order.points_awarded ?? false)) {
      updateFields.points_awarded = pointsAwarded
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', orderId)

    if (updateErr) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al actualizar el estado de la orden en base de datos.',
            request_id: requestId
          }
        }
      })
    }

    // 6. Registrar en auditoría inmutable
    await supabase
      .from('audit_events')
      .insert({
        actor_id: adminUser.user.id,
        action: 'order.status',
        entity: 'orders',
        entity_id: orderId,
        result: 'ok',
        request_id: requestId
      })

    return {
      request_id: requestId,
      order_id: orderId,
      from: oldStatus,
      to: newStatus,
      inventory_processed: inventoryProcessed,
      points_awarded: pointsAwarded
    }
  }

  /**
   * Crea una orden manual de mostrador por parte del administrador.
   * Calcula precios oficiales del servidor y no crea perfiles fantasma.
   */
  static async createAdminOrder(
    event: H3Event,
    dto: AdminCreateOrderInput,
    idempotencyKey: string,
    requestId: string
  ): Promise<CheckoutResult> {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    // 1. Validar profile_id si viene especificado
    if (dto.profile_id) {
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', dto.profile_id)
        .maybeSingle()

      if (profErr || !prof) {
        throw createError({
          statusCode: 422,
          statusMessage: 'PROFILE_NOT_FOUND',
          data: {
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: `El perfil con ID '${dto.profile_id}' no existe.`,
              request_id: requestId
            }
          }
        })
      }
    }

    // 2. Gestión de Idempotencia para Admin
    const principalScope = `admin:${adminUser.user.id}`
    const canonicalPayload = JSON.stringify({
      channel: dto.channel,
      customer_name: dto.customer_name,
      customer_phone: dto.customer_phone || '',
      address: dto.address || '',
      delivery_date: dto.delivery_date || '',
      delivery_time: dto.delivery_time || '',
      profile_id: dto.profile_id || null,
      items: dto.items
        .map(i => ({ product_id: i.product_id, quantity: i.quantity }))
        .sort((a, b) => a.product_id - b.product_id)
    })
    const requestHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex')

    const { data: existingKey } = await supabase
      .from('checkout_idempotency_keys')
      .select('*')
      .eq('operation', 'admin.order.create')
      .eq('principal_scope', principalScope)
      .eq('key', idempotencyKey)
      .maybeSingle()

    if (existingKey) {
      const keyRow = existingKey
      if (keyRow.request_hash !== requestHash) {
        throw createError({
          statusCode: 409,
          statusMessage: 'IDEMPOTENCY_KEY_REUSED',
          data: {
            error: {
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'La clave de idempotencia ya fue utilizada con un pedido diferente.',
              request_id: requestId
            }
          }
        })
      }

      if (keyRow.lifecycle === 'processing') {
        setResponseHeader(event, 'Retry-After', 2)
        throw createError({
          statusCode: 409,
          statusMessage: 'IDEMPOTENCY_IN_PROGRESS',
          data: {
            error: {
              code: 'IDEMPOTENCY_IN_PROGRESS',
              message: 'El pedido aún se está procesando. Reintenta en unos segundos.',
              request_id: requestId
            }
          }
        })
      }

      if (keyRow.lifecycle === 'completed' && keyRow.response_payload) {
        return {
          request_id: requestId,
          order: keyRow.response_payload as unknown as CheckoutResponseOrder
        }
      }
    }

    // Registrar clave en 'processing'
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('checkout_idempotency_keys')
      .insert({
        operation: 'admin.order.create',
        principal_scope: principalScope,
        key: idempotencyKey,
        request_hash: requestHash,
        lifecycle: 'processing',
        expires_at: expiresAt
      })

    try {
      // 3. Consultar precios oficiales del catálogo
      const productIds = dto.items.map(i => i.product_id)
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, price')
        .in('id', productIds)

      if (prodError || !products) {
        throw createError({
          statusCode: 500,
          statusMessage: 'INTERNAL_ERROR',
          data: {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Error al consultar productos del catálogo.',
              request_id: requestId
            }
          }
        })
      }

      const productMap = new Map(products.map(p => [p.id, p]))
      for (const item of dto.items) {
        if (!productMap.has(item.product_id)) {
          throw createError({
            statusCode: 422,
            statusMessage: 'PRODUCT_NOT_FOUND',
            data: {
              error: {
                code: 'PRODUCT_NOT_FOUND',
                message: `El producto con ID ${item.product_id} no existe en el catálogo.`,
                request_id: requestId
              }
            }
          })
        }
      }

      // 4. Calcular importes exactos en céntimos
      let totalCents = 0
      const orderItemsToInsert: Array<{
        product_id: number
        name: string
        quantity: number
        priceCents: number
        priceString: string
      }> = []

      for (const item of dto.items) {
        const prod = productMap.get(item.product_id)!
        const unitPriceCents = solesToCents(prod.price ?? 0)
        const lineTotalCents = unitPriceCents * item.quantity
        totalCents += lineTotalCents

        orderItemsToInsert.push({
          product_id: item.product_id,
          name: prod.name,
          quantity: item.quantity,
          priceCents: unitPriceCents,
          priceString: centsToSoles(unitPriceCents)
        })
      }

      const totalAmountString = centsToSoles(totalCents)

      // 5. Insertar cabecera de orden
      const { data: createdOrder, error: orderInsertError } = await supabase
        .from('orders')
        .insert({
          profile_id: dto.profile_id || null,
          customer_name: dto.customer_name,
          customer_phone: dto.customer_phone || null,
          address: dto.address || null,
          total_amount: Number(totalAmountString),
          status: 'pending',
          delivery_date: dto.delivery_date || null,
          delivery_time: dto.delivery_time || null,
          notes: dto.notes || null,
          inventory_processed: false,
          points_awarded: false
        })
        .select()
        .single()

      if (orderInsertError || !createdOrder) {
        throw new Error(orderInsertError?.message || 'Fallo al insertar cabecera de la orden')
      }

      // 6. Insertar ítems
      const itemsPayload = orderItemsToInsert.map(it => ({
        order_id: createdOrder.id,
        product_id: it.product_id,
        quantity: it.quantity,
        price_at_time: Number(it.priceString)
      }))

      const { error: itemsInsertError } = await supabase
        .from('order_items')
        .insert(itemsPayload)

      if (itemsInsertError) {
        await supabase.from('orders').delete().eq('id', createdOrder.id)
        throw new Error(itemsInsertError.message || 'Fallo al insertar líneas de orden')
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

      // 7. Marcar idempotencia completada
      await supabase
        .from('checkout_idempotency_keys')
        .update({
          lifecycle: 'completed',
          order_id: createdOrder.id,
          response_payload: responseOrder as unknown as Database['public']['Tables']['checkout_idempotency_keys']['Update']['response_payload']
        })
        .eq('operation', 'admin.order.create')
        .eq('principal_scope', principalScope)
        .eq('key', idempotencyKey)

      // 8. Auditoría
      await supabase
        .from('audit_events')
        .insert({
          actor_id: adminUser.user.id,
          action: 'order.create_admin',
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
      await supabase
        .from('checkout_idempotency_keys')
        .delete()
        .eq('operation', 'admin.order.create')
        .eq('principal_scope', principalScope)
        .eq('key', idempotencyKey)
        .eq('lifecycle', 'processing')

      const msg = dbErr instanceof Error ? dbErr.message : 'Error inesperado al crear orden admin'
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

