import type { H3Event } from 'h3'
import { createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../utils/require-admin'

export interface CreateMaterialInput {
  name: string
  purchase_price: number
  purchase_quantity: number
  unit: string
  stock?: number
}

export interface UpdateMaterialInput {
  name?: string
  purchase_price?: number
  purchase_quantity?: number
  unit?: string
  stock?: number
  reason?: string
}

export class InventoryService {
  static async createMaterial(event: H3Event, dto: CreateMaterialInput, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    const initialStock = Number(dto.stock ?? 0)

    const { data, error } = await supabase
      .from('raw_materials')
      .insert({
        name: dto.name.trim(),
        purchase_price: Number(dto.purchase_price),
        purchase_quantity: Number(dto.purchase_quantity),
        unit: dto.unit.trim(),
        stock: initialStock
      })
      .select()
      .single()

    if (error || !data) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: `Error al crear materia prima: ${error?.message}`,
            request_id: requestId
          }
        }
      })
    }

    // Si nace con stock inicial mayor a cero, registrar movimiento inicial
    if (initialStock > 0) {
      await supabase.from('inventory_movements').insert({
        raw_material_id: data.id,
        type: 'manual_adjustment',
        quantity_delta: initialStock,
        stock_before: 0,
        stock_after: initialStock,
        reason: 'Inventario inicial al crear insumo',
        actor_id: adminUser.user.id,
        request_id: requestId
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'material.write',
      entity: 'raw_materials',
      entity_id: String(data.id),
      result: 'ok',
      request_id: requestId
    })

    return data
  }

  static async updateMaterial(event: H3Event, id: number, dto: UpdateMaterialInput, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    // Consultar stock previo
    const { data: existing, error: existErr } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('id', id)
      .single()

    if (existErr || !existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'NOT_FOUND',
        data: {
          error: {
            code: 'NOT_FOUND',
            message: `Materia prima con ID ${id} no encontrada.`,
            request_id: requestId
          }
        }
      })
    }

    const updatePayload: Database['public']['Tables']['raw_materials']['Update'] = {}
    if (dto.name !== undefined) updatePayload.name = dto.name.trim()
    if (dto.purchase_price !== undefined) updatePayload.purchase_price = Number(dto.purchase_price)
    if (dto.purchase_quantity !== undefined) updatePayload.purchase_quantity = Number(dto.purchase_quantity)
    if (dto.unit !== undefined) updatePayload.unit = dto.unit.trim()

    const stockBefore = Number(existing.stock ?? 0)
    let isStockAdjusted = false

    if (dto.stock !== undefined) {
      const newStock = Number(dto.stock)
      updatePayload.stock = newStock

      if (newStock !== stockBefore) {
        isStockAdjusted = true
        const delta = newStock - stockBefore

        await supabase.from('inventory_movements').insert({
          raw_material_id: id,
          type: 'manual_adjustment',
          quantity_delta: delta,
          stock_before: stockBefore,
          stock_after: newStock,
          reason: dto.reason || 'Ajuste manual de almacén',
          actor_id: adminUser.user.id,
          request_id: requestId
        })
      }
    }

    const { data, error } = await supabase
      .from('raw_materials')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: `Error al actualizar materia prima: ${error?.message}`,
            request_id: requestId
          }
        }
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: isStockAdjusted ? 'stock.adjust' : 'material.write',
      entity: 'raw_materials',
      entity_id: String(id),
      result: 'ok',
      request_id: requestId
    })

    return data
  }

  static async deleteMaterial(event: H3Event, id: number, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    const { error } = await supabase
      .from('raw_materials')
      .delete()
      .eq('id', id)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: `Error al eliminar materia prima: ${error.message}`,
            request_id: requestId
          }
        }
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'material.write',
      entity: 'raw_materials',
      entity_id: String(id),
      result: 'ok',
      request_id: requestId
    })

    return { success: true }
  }

  /**
   * Ejecuta la reversión atómica de stock o declaración de mermas al cancelar un pedido procesado (ADR-001 / D1).
   */
  static async revertOrderInventory(
    event: H3Event,
    orderId: string,
    reason: string,
    restoreStock: boolean,
    requestId: string
  ) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    // Llamada segura a la RPC atómica revert_order_inventory
    const rpcCaller = supabase.rpc as unknown as (
      name: string,
      params: {
        p_order_id: string
        p_reason: string
        p_restore_stock: boolean
        p_actor_id: string
        p_request_id: string
      }
    ) => Promise<{ data: { success: boolean; restored_stock: boolean; items_affected: number } | null; error: Error | null }>

    const { data, error } = await rpcCaller('revert_order_inventory', {
      p_order_id: orderId,
      p_reason: reason,
      p_restore_stock: restoreStock,
      p_actor_id: adminUser.user.id,
      p_request_id: requestId
    })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INVENTORY_REVERSION_FAILED',
        data: {
          error: {
            code: 'INVENTORY_REVERSION_FAILED',
            message: `Error al revertir inventario de la orden: ${error.message}`,
            request_id: requestId
          }
        }
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: restoreStock ? 'inventory.reversal' : 'inventory.waste',
      entity: 'orders',
      entity_id: orderId,
      result: 'ok',
      request_id: requestId
    })

    return data
  }
}
