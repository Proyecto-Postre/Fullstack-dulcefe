/**
 * Tipos de Dominio para Snapshot de Escandallo y Congelamiento de Costos (Fase 6 / ADR-008)
 */

export interface CostSnapshotIngredient {
  material_id: number
  material_name: string
  unit: string
  quantity_used: number
  cost_per_unit_cents: number
  total_cost_cents: number
}

export interface CostSnapshotItem {
  product_id: number
  product_name: string
  quantity: number
  unit_cost_cents: number
  total_cost_cents: number
  ingredients: CostSnapshotIngredient[]
}

export interface OrderCostSnapshot {
  order_id: string
  calculated_at: string
  total_amount_cents: number
  total_cost_cents: number
  gross_margin_cents: number
  gross_margin_percentage: number
  items: CostSnapshotItem[]
}
