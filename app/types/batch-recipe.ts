export type BatchWasteReason =
  | 'personal_consumption'
  | 'gift'
  | 'spoilage'
  | 'direct_sale'

export interface BaseRecipeItemInput {
  raw_material_id: number
  quantity_used: number
}

export interface RecipeYieldInput {
  size_name: string
  yield_units: number
}

export interface BaseRecipeInput {
  name: string
  description?: string
  labor_cost?: number
  utilities_cost?: number
  items: BaseRecipeItemInput[]
  yields: RecipeYieldInput[]
}

export interface BaseRecipeItemDetail {
  id?: number
  base_recipe_id?: number
  raw_material_id: number
  material_name: string
  unit: string
  purchase_price: number
  purchase_quantity: number
  quantity_used: number
  cost_per_unit: number // Costo por gramo o ml
  item_total_cost: number // quantity_used * cost_per_unit
}

export interface RecipeYieldDetail {
  id?: number
  base_recipe_id?: number
  size_name: string
  yield_units: number
  unit_cost: number // Costo total tanda / yield_units
}

export interface BaseRecipeDetail {
  id: number
  name: string
  description: string | null
  labor_cost: number
  utilities_cost: number
  cif_total: number // labor_cost + utilities_cost
  materials_total_cost: number
  total_batch_cost: number // materials_total_cost + cif_total
  created_at: string
  updated_at: string
  items: BaseRecipeItemDetail[]
  yields: RecipeYieldDetail[]
}

export interface ProductRecipeMappingInput {
  product_id: number
  recipe_yield_id: number
  units_contained: number
}

export interface ProductPackagingItemInput {
  product_id: number
  raw_material_id: number
  quantity_used: number
}

export interface ProductBatchComposition {
  product_id: number
  mapping: {
    id: number
    recipe_yield_id: number
    size_name: string
    yield_units: number
    units_contained: number
    unit_piece_cost: number
    base_recipe_id: number
    base_recipe_name: string
    portion_fraction: number // units_contained / yield_units
    dough_cost: number // units_contained * unit_piece_cost
  } | null
  packaging_items: Array<{
    id: number
    raw_material_id: number
    material_name: string
    unit: string
    quantity_used: number
    unit_cost: number
    total_cost: number
  }>
  total_product_cost: number
}

export interface QuickPieceDeductionInput {
  recipe_yield_id: number
  pieces_count: number
  reason: BatchWasteReason
  notes?: string
}

export interface QuickPieceDeductionResult {
  success: boolean
  log_id: string
  pieces_deducted: number
  yield_name: string
  base_recipe_name: string
  deducted_materials: Array<{
    material_id: number
    material_name: string
    unit: string
    quantity_deducted: number
  }>
}
