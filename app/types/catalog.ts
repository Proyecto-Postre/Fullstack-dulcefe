import type { Database } from './database.types'

export type ProductRow = Database['public']['Tables']['products']['Row']

export interface CatalogProduct {
  id: number
  name: string
  price: number
  stock: number
  image_url: string | null
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface CatalogCategory {
  id: string
  name: string
  icon: string
}

export interface CatalogApiResponse {
  success: boolean
  count: number
  data: CatalogProduct[]
}

export interface ProductFormData {
  id?: number | string
  name: string
  price: number | string
  stock: number | string
  image_url: string
}

export interface ProductUploadResponse {
  success: boolean
  url: string
}
