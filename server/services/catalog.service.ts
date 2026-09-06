import type { H3Event } from 'h3'
import { createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../utils/require-admin'

export interface CreateProductInput {
  name: string
  price: number
  stock?: number
  image_url?: string | null
}

export interface UpdateProductInput {
  name?: string
  price?: number
  stock?: number
  image_url?: string | null
}

export class CatalogService {
  static async createProduct(event: H3Event, dto: CreateProductInput, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: dto.name.trim(),
        price: Number(dto.price),
        stock: Number(dto.stock ?? 0),
        image_url: dto.image_url || null
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
            message: `Error al crear producto: ${error?.message}`,
            request_id: requestId
          }
        }
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'product.write',
      entity: 'products',
      entity_id: String(data.id),
      result: 'ok',
      request_id: requestId
    })

    return data
  }

  static async updateProduct(event: H3Event, id: number, dto: UpdateProductInput, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    const updatePayload: Database['public']['Tables']['products']['Update'] = {}
    if (dto.name !== undefined) updatePayload.name = dto.name.trim()
    if (dto.price !== undefined) updatePayload.price = Number(dto.price)
    if (dto.stock !== undefined) updatePayload.stock = Number(dto.stock)
    if (dto.image_url !== undefined) updatePayload.image_url = dto.image_url

    const { data, error } = await supabase
      .from('products')
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
            message: `Error al actualizar producto: ${error?.message}`,
            request_id: requestId
          }
        }
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'product.write',
      entity: 'products',
      entity_id: String(id),
      result: 'ok',
      request_id: requestId
    })

    return data
  }

  static async deleteProduct(event: H3Event, id: number, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = serverSupabaseServiceRole<Database>(event)

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: {
          error: {
            code: 'INTERNAL_ERROR',
            message: `Error al eliminar producto: ${error.message}`,
            request_id: requestId
          }
        }
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'product.write',
      entity: 'products',
      entity_id: String(id),
      result: 'ok',
      request_id: requestId
    })

    return { success: true }
  }
}
