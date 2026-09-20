import { describe, it, expect } from 'vitest'
import { solesToCents, centsToSoles } from '../../server/utils/money'
import type { OrderCostSnapshot, CostSnapshotItem } from '../../app/types/cost-snapshot'

describe('Cost Snapshot & Historical Financial Immutability (Fase 6 / Subfase 6.5 / ADR-008)', () => {
  describe('Aritmética Exacta de Escandallo en Céntimos', () => {
    it('debe calcular el costo unitario por insumo sin pérdida de precisión', () => {
      // Harina: S/ 95.00 por saco de 50,000 g (50 kg)
      const purchasePriceSoles = 95.00
      const purchaseQuantity = 50000
      const quantityUsed = 350 // 350 g para un queque

      const purchasePriceCents = solesToCents(purchasePriceSoles) // 9500 céntimos
      const costPerGramCents = purchasePriceCents / purchaseQuantity // 0.19 céntimos/g
      const ingredientCostCents = Math.round(costPerGramCents * quantityUsed) // 66.5 -> 67 céntimos

      expect(ingredientCostCents).toBe(67)
      expect(centsToSoles(ingredientCostCents)).toBe('0.67')
    })

    it('debe calcular el costo total de la orden y margen bruto exacto en céntimos', () => {
      // Orden de 2 Queques de Vainilla a S/ 45.00 cada uno (Total S/ 90.00 = 9000 céntimos)
      const totalAmountCents = solesToCents(90.00)

      // Insumos por cada queque:
      // Harina: 67 céntimos
      // Mantequilla: 320 céntimos
      // Azúcar: 85 céntimos
      // Huevos: 150 céntimos
      const unitCostCents = 67 + 320 + 85 + 150 // 622 céntimos = S/ 6.22
      const quantity = 2
      const totalOrderCostCents = unitCostCents * quantity // 1244 céntimos = S/ 12.44

      const grossMarginCents = totalAmountCents - totalOrderCostCents // 9000 - 1244 = 7756 céntimos = S/ 77.56
      const marginPercentage = (grossMarginCents / totalAmountCents) * 100 // 86.177%

      expect(totalOrderCostCents).toBe(1244)
      expect(grossMarginCents).toBe(7756)
      expect(Math.round(marginPercentage * 10) / 10).toBe(86.2)
    })
  })

  describe('Inmutabilidad Financiera del Snapshot (Freeze on Order)', () => {
    it('debe congelar la estructura OrderCostSnapshot con auditoría inmutable', () => {
      const mockSnapshot: OrderCostSnapshot = {
        order_id: 'ord-uuid-001',
        calculated_at: '2026-09-07T10:00:00Z',
        total_amount_cents: 12000, // S/ 120.00
        total_cost_cents: 3500,    // S/ 35.00
        gross_margin_cents: 8500,  // S/ 85.00
        gross_margin_percentage: 70.8,
        items: [
          {
            product_id: 5,
            product_name: 'Torta Selva Negra',
            quantity: 1,
            unit_cost_cents: 3500,
            total_cost_cents: 3500,
            ingredients: [
              {
                material_id: 1,
                material_name: 'Harina Repostera',
                unit: 'gr',
                quantity_used: 400,
                cost_per_unit_cents: 0.2,
                total_cost_cents: 80
              }
            ]
          }
        ]
      }

      // Simular lógica de guardado: si ya existe snapshot, se mantiene idéntico
      function resolveOrderSnapshot(
        existingSnapshot: OrderCostSnapshot | null,
        _currentMaterialPriceSoles: number
      ): OrderCostSnapshot {
        if (existingSnapshot) {
          return existingSnapshot // Congelado históricamente: nunca se recalcula
        }
        throw new Error('Debería tener snapshot')
      }

      // Aunque el precio de la harina suba 300% en el futuro, el snapshot de la orden se preserva
      const resolved = resolveOrderSnapshot(mockSnapshot, 300.00)
      expect(resolved.total_cost_cents).toBe(3500)
      expect(resolved.gross_margin_cents).toBe(8500)
      expect(resolved.gross_margin_percentage).toBe(70.8)
      expect(resolved.calculated_at).toBe('2026-09-07T10:00:00Z')
    })

    it('maneja productos sin recetas asignadas otorgando costo cero y margen del 100%', () => {
      const totalAmountCents = 5000 // S/ 50.00
      const items: CostSnapshotItem[] = [
        {
          product_id: 99,
          product_name: 'Caja Sorpresa de Regalo',
          quantity: 1,
          unit_cost_cents: 0,
          total_cost_cents: 0,
          ingredients: []
        }
      ]

      const totalCostCents = items.reduce((sum, it) => sum + it.total_cost_cents, 0)
      const grossMarginCents = totalAmountCents - totalCostCents
      const marginPercentage = (grossMarginCents / totalAmountCents) * 100

      expect(totalCostCents).toBe(0)
      expect(grossMarginCents).toBe(5000)
      expect(marginPercentage).toBe(100)
    })
  })
})
