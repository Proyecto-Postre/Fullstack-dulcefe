import type { H3Event } from 'h3'
import { createError } from 'h3'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../utils/require-admin'
import { getAdminSupabaseClient } from '../utils/server-supabase'

export interface CreateProductInput {
  name: string
  price: number
  stock?: number
  image_url?: string | null
  description?: string | null
  is_featured?: boolean | null
  category_id?: string | null
  shelf_life?: string | null
  portions?: number | null
}

export interface UpdateProductInput {
  name?: string
  price?: number
  stock?: number
  image_url?: string | null
  description?: string | null
  is_featured?: boolean | null
  category_id?: string | null
  shelf_life?: string | null
  portions?: number | null
}

export interface CreateCategoryInput {
  id?: string
  name: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

export interface UpdateCategoryInput {
  name?: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

export class CatalogService {
  static async createProduct(event: H3Event, dto: CreateProductInput, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const insertPayload: Record<string, unknown> = {
      name: dto.name.trim(),
      price: Number(dto.price),
      stock: Number(dto.stock ?? 0),
      image_url: dto.image_url || null
    }
    if (dto.description !== undefined) {
      insertPayload.description = dto.description ? dto.description.trim() : null
    }
    if (dto.is_featured !== undefined) {
      insertPayload.is_featured = Boolean(dto.is_featured)
    }
    if (dto.category_id !== undefined) {
      insertPayload.category_id = dto.category_id
    }
    if (dto.shelf_life !== undefined) {
      insertPayload.shelf_life = dto.shelf_life ? dto.shelf_life.trim() : null
    }
    if (dto.portions !== undefined) {
      insertPayload.portions = dto.portions !== null && !isNaN(Number(dto.portions)) ? Number(dto.portions) : null
    }

    const { data, error } = await supabase
      .from('products')
      .insert(insertPayload as Database['public']['Tables']['products']['Insert'])
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
    const supabase = await getAdminSupabaseClient(event)

    const updatePayload: Record<string, unknown> = {}
    if (dto.name !== undefined) updatePayload.name = dto.name.trim()
    if (dto.price !== undefined) updatePayload.price = Number(dto.price)
    if (dto.stock !== undefined) updatePayload.stock = Number(dto.stock)
    if (dto.image_url !== undefined) updatePayload.image_url = dto.image_url
    if (dto.description !== undefined) {
      updatePayload.description = dto.description ? dto.description.trim() : null
    }
    if (dto.is_featured !== undefined) {
      updatePayload.is_featured = Boolean(dto.is_featured)
    }
    if (dto.category_id !== undefined) updatePayload.category_id = dto.category_id
    if (dto.shelf_life !== undefined) {
      updatePayload.shelf_life = dto.shelf_life ? dto.shelf_life.trim() : null
    }
    if (dto.portions !== undefined) {
      updatePayload.portions = dto.portions !== null && !isNaN(Number(dto.portions)) ? Number(dto.portions) : null
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload as Database['public']['Tables']['products']['Update'])
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
    const supabase = await getAdminSupabaseClient(event)

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

  // =========================================================================
  // GESTIÓN ADMINISTRATIVA DE CATEGORÍAS / SECCIONES
  // =========================================================================

  static async listAdminCategories(event: H3Event) {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          order: (c: string, o: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
        }
      }
    })
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error al listar categorías: ${error.message}`
      })
    }

    return data || []
  }

  static async createCategory(event: H3Event, dto: CreateCategoryInput, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const slug = (dto.id || dto.name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim()

    const payload = {
      id: slug,
      name: dto.name.trim(),
      icon: dto.icon || 'lucide:sparkles',
      sort_order: Number(dto.sort_order ?? 0),
      is_active: dto.is_active ?? true
    }

    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        insert: (p: typeof payload) => {
          select: () => {
            single: () => Promise<{ data: typeof payload | null; error: { message: string } | null }>
          }
        }
      }
    })
      .from('categories')
      .insert(payload)
      .select()
      .single()

    if (error || !data) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error al crear categoría: ${error?.message}`
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'category.write',
      entity: 'categories',
      entity_id: slug,
      result: 'ok',
      request_id: requestId
    })

    return data
  }

  static async updateCategory(event: H3Event, id: string, dto: UpdateCategoryInput, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const updatePayload: Record<string, unknown> = {}
    if (dto.name !== undefined) updatePayload.name = dto.name.trim()
    if (dto.icon !== undefined) updatePayload.icon = dto.icon
    if (dto.sort_order !== undefined) updatePayload.sort_order = Number(dto.sort_order)
    if (dto.is_active !== undefined) updatePayload.is_active = Boolean(dto.is_active)

    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        update: (p: Record<string, unknown>) => {
          eq: (col: string, val: string) => {
            select: () => {
              single: () => Promise<{ data: unknown | null; error: { message: string } | null }>
            }
          }
        }
      }
    })
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error al actualizar categoría: ${error?.message}`
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'category.write',
      entity: 'categories',
      entity_id: id,
      result: 'ok',
      request_id: requestId
    })

    return data
  }

  static async deleteCategory(event: H3Event, id: string, requestId: string) {
    const adminUser = await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        delete: () => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>
        }
      }
    })
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error al eliminar categoría: ${error.message}`
      })
    }

    await supabase.from('audit_events').insert({
      actor_id: adminUser.user.id,
      action: 'category.write',
      entity: 'categories',
      entity_id: id,
      result: 'ok',
      request_id: requestId
    })

    return { success: true }
  }
}
