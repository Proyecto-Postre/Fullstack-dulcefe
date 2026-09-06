import { defineEventHandler, createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../utils/require-admin'
import { getOrCreateRequestId } from '../../../utils/request-id'
import type { KdsOrder } from '~/utils/kds'

export default defineEventHandler(async (event) => {
  const requestId = getOrCreateRequestId(event)
  await requireAdmin(event)

  const supabase = serverSupabaseServiceRole<Database>(event)

  // Consultar pedidos activos para cocina (pending, processing, ready)
  const { data: rawOrders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      status,
      delivery_date,
      delivery_time,
      created_at,
      notes,
      order_items (
        id,
        quantity,
        product_id,
        products ( id, name )
      )
    `)
    .in('status', ['pending', 'processing', 'ready'])
    .order('created_at', { ascending: true })

  if (ordersError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_ERROR',
      data: {
        error: {
          code: 'INTERNAL_ERROR',
          message: `Error al obtener comandas para KDS: ${ordersError.message}`,
          request_id: requestId
        }
      }
    })
  }

  // Recolectar product_ids únicos para obtener sus recetas
  const productIds = new Set<number>()
  for (const ord of rawOrders || []) {
    for (const item of (ord.order_items || []) as Array<{ product_id: number | null }>) {
      if (item.product_id) {
        productIds.add(item.product_id)
      }
    }
  }

  const recipeMap = new Map<number, Array<{
    material_id: number
    material_name: string
    unit: string
    quantity_used: number
  }>>()

  if (productIds.size > 0) {
    const { data: recipes, error: recipeErr } = await supabase
      .from('recipe_items')
      .select(`
        product_id,
        raw_material_id,
        quantity_used,
        raw_materials ( id, name, unit )
      `)
      .in('product_id', Array.from(productIds))

    if (!recipeErr && recipes) {
      for (const r of recipes) {
        const list = recipeMap.get(r.product_id) || []
        const rawMat = r.raw_materials as { id?: number; name?: string | null; unit?: string | null } | null
        list.push({
          material_id: r.raw_material_id,
          material_name: rawMat?.name || `Insumo #${r.raw_material_id}`,
          unit: rawMat?.unit || 'gr',
          quantity_used: Number(r.quantity_used || 0)
        })
        recipeMap.set(r.product_id, list)
      }
    }
  }

  // Mapear a KdsOrder
  const kdsOrders: KdsOrder[] = (rawOrders || []).map((ord) => ({
    id: ord.id,
    short_id: ord.id.slice(0, 8),
    customer_name: ord.customer_name || 'Cliente sin nombre',
    status: (ord.status || 'pending') as KdsOrder['status'],
    delivery_date: ord.delivery_date,
    delivery_time: ord.delivery_time,
    created_at: ord.created_at,
    notes: ord.notes,
    items: ((ord.order_items || []) as Array<{
      product_id: number | null
      quantity: number
      products: { id: number; name: string } | null
    }>).map((item) => ({
      product_id: item.product_id ?? 0,
      product_name: item.products?.name || 'Producto sin nombre',
      quantity: item.quantity,
      recipe: item.product_id ? (recipeMap.get(item.product_id) || []) : []
    }))
  }))

  return {
    success: true,
    data: kdsOrders
  }
})
