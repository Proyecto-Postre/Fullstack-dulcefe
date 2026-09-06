import type { H3Event } from 'h3'
import { createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../utils/require-admin'
import { solesToCents, centsToSoles } from '../utils/money'

export interface SaveRecipeItemInput {
  product_id: number
  raw_material_id: number
  quantity_used: number
}

export class RecipeService {
  static async getRecipeWithCosts(event: H3Event, productId: number, requestId: string) {
    await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    // 1. Consultar receta
    const { data: recipeItems, error: recipeErr } = await supabase
      .from('recipe_items')
      .select('*, raw_materials(*)')
      .eq('product_id', productId)

    if (recipeErr) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: `Error al obtener receta: ${recipeErr.message}`,
            request_id: requestId
          }
        }
      })
    }

    // 2. Calcular costos exactos en el servidor
    interface RecipeItemJoin {
      id: number
      product_id: number
      raw_material_id: number
      quantity_used: number
      raw_materials: {
        name?: string | null
        unit?: string | null
        purchase_price?: number | null
        purchase_quantity?: number | null
      } | null
    }

    let totalRecipeCostCents = 0
    const calculatedItems = ((recipeItems || []) as unknown as RecipeItemJoin[]).map((item) => {
      const mat = item.raw_materials
      const purchasePriceCents = solesToCents(mat?.purchase_price ?? 0)
      const purchaseQty = Number(mat?.purchase_quantity ?? 1)
      const costPerGramCents = purchaseQty > 0 ? purchasePriceCents / purchaseQty : 0

      const quantityUsed = Number(item.quantity_used ?? 0)
      const itemCostCents = Math.round(costPerGramCents * quantityUsed)
      totalRecipeCostCents += itemCostCents

      return {
        id: item.id,
        product_id: item.product_id,
        raw_material_id: item.raw_material_id,
        material_name: mat?.name ?? 'Desconocido',
        unit: mat?.unit ?? 'g',
        quantity_used: quantityUsed,
        unit_cost: centsToSoles(Math.round(costPerGramCents)),
        item_cost: centsToSoles(itemCostCents)
      }
    })

    return {
      product_id: productId,
      total_cost: centsToSoles(totalRecipeCostCents),
      items: calculatedItems
    }
  }

  static async saveRecipeItem(event: H3Event, dto: SaveRecipeItemInput, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    const { data, error } = await supabase
      .from('recipe_items')
      .insert({
        product_id: dto.product_id,
        raw_material_id: dto.raw_material_id,
        quantity_used: Number(dto.quantity_used)
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
            message: `Error al guardar ingrediente en receta: ${error?.message}`,
            request_id: requestId
          }
        }
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'recipe.write',
      entity: 'recipe_items',
      entity_id: String(data.id),
      result: 'ok',
      request_id: requestId
    })

    return data
  }

  static async deleteRecipeItem(event: H3Event, id: number, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    const { error } = await supabase
      .from('recipe_items')
      .delete()
      .eq('id', id)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: `Error al eliminar ingrediente de receta: ${error.message}`,
            request_id: requestId
          }
        }
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'recipe.write',
      entity: 'recipe_items',
      entity_id: String(id),
      result: 'ok',
      request_id: requestId
    })

    return { success: true }
  }
}
