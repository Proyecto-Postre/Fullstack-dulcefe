import type { Database } from './database.types'

export type RecipeItemRow = Database['public']['Tables']['recipe_items']['Row']

export interface RecipeItem {
  id: number | string
  product_id: number
  raw_material_id: number
  material_name?: string
  name?: string
  unit: string
  quantity_used: number
  unit_cost?: number
  cost_per_unit?: number
  item_cost?: number
  item_total_cost?: number
}

export interface AdditionalCosts {
  packaging: number | string
  utilities: number | string
  labor: number | string
}

export interface RecipeApiResponse {
  success: boolean
  totalCost?: number
  total_cost?: number
  data: RecipeItem[]
}

export interface NewRecipeItemInput {
  raw_material_id: number | string
  quantity_used: number | string
}

export interface RecipePublishInput {
  price: number | string
  stock: number | string
}

export interface ProfitAnalysis {
  totalCost: number
  profitMargin: number
  profitMarginPercent: number
  suggestedPrice: number
}
