import type { Database } from './database.types'

export type RawMaterialRow = Database['public']['Tables']['raw_materials']['Row']
export type InventoryMovementRow = Database['public']['Tables']['inventory_movements']['Row']

export type BaseUnit = 'kg' | 'g' | 'L' | 'ml' | 'und'

export interface MaterialFormData {
  id?: number | string
  name: string
  unit: BaseUnit | string
  purchase_price: number | string
  purchase_quantity: number | string
  stock: number | string
}

export interface MaterialApiResponse {
  success: boolean
  count?: number
  data: RawMaterialRow[]
}

export interface StockAdjustmentInput {
  material_id: number
  new_stock: number
  reason?: string
}
