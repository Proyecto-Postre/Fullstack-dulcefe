import type { H3Event } from 'h3'
import { createError } from 'h3'
import { requireAdmin } from '../utils/require-admin'
import { getAdminSupabaseClient } from '../utils/server-supabase'

export interface KardexFilter {
  materialId?: number
  type?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface EventsFilter {
  entity?: string
  action?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface WasteFilter {
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface FinancialFilter {
  from?: string
  to?: string
  page?: number
  limit?: number
}

export class AuditService {
  /**
   * Obtiene el listado paginado del Kárdex de Insumos (inventory_movements)
   * con información del material asociado.
   */
  static async getInventoryKardex(event: H3Event, filters: KardexFilter = {}) {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const page = Math.max(1, Number(filters.page || 1))
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)))
    const offset = (page - 1) * limit

    let query = supabase
      .from('inventory_movements')
      .select('*, raw_materials(id, name, unit, type)', { count: 'exact' })

    if (filters.materialId && filters.materialId > 0) {
      query = query.eq('raw_material_id', filters.materialId)
    }

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters.from) {
      query = query.gte('created_at', filters.from)
    }

    if (filters.to) {
      query = query.lte('created_at', filters.to)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error al consultar kárdex de inventario: ${error.message}`
      })
    }

    return {
      items: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  /**
   * Obtiene el listado cronológico de eventos de auditoría inmutable (audit_events).
   */
  static async getSystemEvents(event: H3Event, filters: EventsFilter = {}) {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const page = Math.max(1, Number(filters.page || 1))
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)))
    const offset = (page - 1) * limit

    let query = supabase
      .from('audit_events')
      .select('*', { count: 'exact' })

    if (filters.entity && filters.entity !== 'all') {
      query = query.eq('entity', filters.entity)
    }

    if (filters.action && filters.action !== 'all') {
      query = query.eq('action', filters.action)
    }

    if (filters.from) {
      query = query.gte('created_at', filters.from)
    }

    if (filters.to) {
      query = query.lte('created_at', filters.to)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error al consultar bitácora de auditoría: ${error.message}`
      })
    }

    return {
      items: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  /**
   * Obtiene el registro de mermas y desperdicios de taller y almacén.
   */
  static async getWasteLogs(event: H3Event, filters: WasteFilter = {}) {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const page = Math.max(1, Number(filters.page || 1))
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)))
    const offset = (page - 1) * limit

    let query = supabase
      .from('piece_waste_logs')
      .select('*, recipe_yields(id, name, base_recipes(id, name, utilities_cost, labor_cost))', { count: 'exact' })

    if (filters.from) {
      query = query.gte('created_at', filters.from)
    }

    if (filters.to) {
      query = query.lte('created_at', filters.to)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error al consultar registro de mermas: ${error.message}`
      })
    }

    return {
      items: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  /**
   * Obtiene la auditoría financiera de órdenes con escandallo congelado (cost_snapshot).
   */
  static async getFinancialAudit(event: H3Event, filters: FinancialFilter = {}) {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const page = Math.max(1, Number(filters.page || 1))
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)))
    const offset = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select('id, code, total_amount, payment_method, payment_status, status, cost_snapshot, total_cost_cents, gross_margin_cents, created_at, customer_name, customer_phone', { count: 'exact' })
      .not('cost_snapshot', 'is', null)

    if (filters.from) {
      query = query.gte('created_at', filters.from)
    }

    if (filters.to) {
      query = query.lte('created_at', filters.to)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error al consultar auditoría financiera de órdenes: ${error.message}`
      })
    }

    return {
      items: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}
