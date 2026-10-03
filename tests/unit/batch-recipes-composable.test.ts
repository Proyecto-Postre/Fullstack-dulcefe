import { describe, it, expect } from 'vitest'
import {
  calculateLiveBatchCost,
  calculateProportionalPreview,
  calculateProductMargins
} from '../../app/composables/admin/useAdminBatchRecipes'
import type { RawMaterialRow } from '../../app/types/inventory'
import type { BaseRecipeDetail } from '../../app/types/batch-recipe'

describe('useAdminBatchRecipes — UI / Client Calculation Logic', () => {
  const mockMaterials: RawMaterialRow[] = [
    {
      id: 1,
      name: 'Harina de Trigo',
      unit: 'g',
      purchase_price: 6.0,
      purchase_quantity: 1000,
      stock: 5000,
      min_stock_alert: 1000,
      created_at: '',
      updated_at: ''
    },
    {
      id: 2,
      name: 'Mantequilla sin sal',
      unit: 'g',
      purchase_price: 15.0,
      purchase_quantity: 500,
      stock: 2000,
      min_stock_alert: 500,
      created_at: '',
      updated_at: ''
    }
  ]

  it('calculates live batch cost with materials and CIF (labor + utilities)', () => {
    // 500g harina = 500 * (6 / 1000) = 3.00
    // 200g mantequilla = 200 * (15 / 500) = 6.00
    // Materiales = 9.00
    // Labor = 5.00, Utilities = 2.00 -> CIF = 7.00
    // Total batch = 16.00
    const items = [
      { raw_material_id: 1, quantity_used: 500 },
      { raw_material_id: 2, quantity_used: 200 }
    ]
    const yields = [
      { size_name: 'Grande', yield_units: 4 },
      { size_name: 'Mediano', yield_units: 8 }
    ]

    const result = calculateLiveBatchCost(items, mockMaterials, 5.0, 2.0, yields)

    expect(result.materialsCost).toBe(9.0)
    expect(result.cifCost).toBe(7.0)
    expect(result.totalCost).toBe(16.0)

    // Yield Grande: 16 / 4 = 4.00 cada pieza
    // Yield Mediano: 16 / 8 = 2.00 cada pieza
    expect(result.yieldCosts[0].unit_cost).toBe(4.0)
    expect(result.yieldCosts[1].unit_cost).toBe(2.0)
  })

  it('calculates proportional deduction preview for loose pieces', () => {
    const mockBatch: BaseRecipeDetail = {
      id: 10,
      name: 'Tanda Brioche',
      description: null,
      labor_cost: 0,
      utilities_cost: 0,
      cif_total: 0,
      materials_total_cost: 10,
      total_batch_cost: 10,
      created_at: '',
      updated_at: '',
      items: [
        {
          id: 1,
          raw_material_id: 1,
          material_name: 'Harina',
          unit: 'g',
          purchase_price: 6,
          purchase_quantity: 1000,
          quantity_used: 1000,
          cost_per_unit: 0.006,
          item_total_cost: 6
        },
        {
          id: 2,
          raw_material_id: 2,
          material_name: 'Mantequilla',
          unit: 'g',
          purchase_price: 15,
          purchase_quantity: 500,
          quantity_used: 200,
          cost_per_unit: 0.03,
          item_total_cost: 6
        }
      ],
      yields: [
        {
          id: 101,
          size_name: 'Roles Medianos',
          yield_units: 10,
          unit_cost: 1.0
        }
      ]
    }

    // Si descargamos 2 roles de un rendimiento de 10 unidades:
    // Fracción = 2 / 10 = 0.20
    // Harina a descontar = 1000 * 0.2 = 200g
    // Mantequilla a descontar = 200 * 0.2 = 40g
    const preview = calculateProportionalPreview(mockBatch, 101, 2)

    expect(preview.length).toBe(2)
    expect(preview[0].material_name).toBe('Harina')
    expect(preview[0].quantity_to_deduct).toBe(200)
    expect(preview[1].material_name).toBe('Mantequilla')
    expect(preview[1].quantity_to_deduct).toBe(40)
  })

  it('calculates commercial profit margins and percentages correctly', () => {
    // Costo total de producto: 15.00, Precio de venta: 25.00
    // Margen Soles = 10.00, Margen % = (10 / 25) * 100 = 40.0%
    const margins = calculateProductMargins(25.0, 15.0)
    expect(margins.marginSoles).toBe(10.0)
    expect(margins.marginPercent).toBe(40.0)

    // Caso precio 0
    const zeroPrice = calculateProductMargins(0, 10.0)
    expect(zeroPrice.marginSoles).toBe(-10.0)
    expect(zeroPrice.marginPercent).toBe(0)
  })
})
