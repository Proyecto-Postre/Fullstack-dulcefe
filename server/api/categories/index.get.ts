import { defineEventHandler } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export interface CategoryDTO {
  id: string
  name: string
  icon: string
  sort_order: number
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await (supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<{ data: CategoryDTO[] | null; error: unknown }>
      }
    }
  })
    .from('categories')
    .select('id, name, icon, sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    // Si la tabla aún no se ha ejecutado en Supabase remoto o está vacía, retornar array vacío
    return {
      success: true,
      data: [] as CategoryDTO[]
    }
  }

  return {
    success: true,
    data: (data || []) as unknown as CategoryDTO[]
  }
})
