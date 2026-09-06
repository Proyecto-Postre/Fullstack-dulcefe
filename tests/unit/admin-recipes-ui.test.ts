import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import {
  calculateComputedTotalCost,
  calculateProfitMargin,
  calculateProfitMarginPercent,
  calculateSuggestedPrice,
  useAdminRecipes
} from '../../app/composables/admin/useAdminRecipes'
import type { ProductRow } from '../../app/types/catalog'
import type { AdditionalCosts } from '../../app/types/recipe'

describe('Fase 4 (PR-4d): Dominio Recetas y Escandallos - Costeo, Rentabilidad y Reactividad', () => {
  describe('calculateComputedTotalCost', () => {
    it('suma correctamente el costo de insumos con los costos indirectos (CIF)', () => {
      const additional: AdditionalCosts = { packaging: 2.5, utilities: 1.2, labor: 3.5 }
      const total = calculateComputedTotalCost(14.8, additional)
      // 14.80 + 2.50 + 1.20 + 3.50 = 22.00
      expect(total).toBe(22)
    })

    it('maneja valores en string y nulos convirtiéndolos a número de forma segura', () => {
      const additional: AdditionalCosts = {
        packaging: '3.00',
        utilities: '1.50',
        labor: '' as unknown as number
      }
      const total = calculateComputedTotalCost(10, additional)
      // 10 + 3.00 + 1.50 + 0 = 14.50
      expect(total).toBe(14.5)
    })

    it('retorna solo el costo de insumos si no hay costos adicionales', () => {
      const additional: AdditionalCosts = { packaging: 0, utilities: 0, labor: 0 }
      expect(calculateComputedTotalCost(18.75, additional)).toBe(18.75)
    })
  })

  describe('calculateProfitMargin', () => {
    it('calcula la ganancia bruta restando costo de venta del precio al público', () => {
      expect(calculateProfitMargin(45.0, 22.0)).toBe(23.0)
      expect(calculateProfitMargin(15.0, 10.25)).toBe(4.75)
    })

    it('retorna margen negativo si el costo supera el precio de venta (pérdida)', () => {
      expect(calculateProfitMargin(20.0, 25.5)).toBe(-5.5)
    })
  })

  describe('calculateProfitMarginPercent', () => {
    it('retorna 0 si el precio de venta es menor o igual a 0 para prevenir división por cero', () => {
      expect(calculateProfitMarginPercent(0, 15)).toBe(0)
      expect(calculateProfitMarginPercent(-10, 15)).toBe(0)
    })

    it('calcula el porcentaje de rentabilidad sobre el precio de venta con 1 decimal', () => {
      // Precio 50, Costo 25 -> Margen 25 -> 50%
      expect(calculateProfitMarginPercent(50.0, 25.0)).toBe(50.0)
      // Precio 45, Costo 22 -> Margen 23 -> (23/45)*100 = 51.111... -> 51.1%
      expect(calculateProfitMarginPercent(45.0, 22.0)).toBe(51.1)
      // Precio 30, Costo 30 -> 0%
      expect(calculateProfitMarginPercent(30.0, 30.0)).toBe(0.0)
    })
  })

  describe('calculateSuggestedPrice', () => {
    it('calcula el precio de venta sugerido para un margen objetivo del 30%', () => {
      // Para costo 14, al 30% de margen sobre venta: 14 / (1 - 0.30) = 14 / 0.70 = 20.00
      expect(calculateSuggestedPrice(14.0, 30)).toBe(20.0)
      // Para costo 0 retorna 0
      expect(calculateSuggestedPrice(0, 30)).toBe(0)
    })

    it('previene división por cero o números negativos si el margen objetivo es >= 100%', () => {
      expect(calculateSuggestedPrice(20.0, 100)).toBe(40.0)
      expect(calculateSuggestedPrice(20.0, 150)).toBe(40.0)
    })
  })

  describe('useAdminRecipes Composable', () => {
    const mockProduct: ProductRow = {
      id: 10,
      name: 'Torta Tres Leches Artesanal',
      price: 40.0,
      stock: 5,
      image_url: '/tres-leches.jpg',
      created_at: '2026-09-01T00:00:00Z'
    }

    it('calcula dinámicamente el costo total y margen al cambiar el producto y costos CIF', () => {
      const activeProduct = ref<ProductRow | null>(mockProduct)
      const {
        recipeTotalCost,
        additionalCosts,
        computedTotalCost,
        profitMargin,
        profitMarginPercent
      } = useAdminRecipes(activeProduct)

      recipeTotalCost.value = 15.0
      additionalCosts.value = { packaging: 2.0, utilities: 1.0, labor: 2.0 }

      // Costo total = 15 + 2 + 1 + 2 = 20
      expect(computedTotalCost.value).toBe(20.0)
      // Precio = 40, Margen = 40 - 20 = 20
      expect(profitMargin.value).toBe(20.0)
      // Margen % = (20 / 40) * 100 = 50.0%
      expect(profitMarginPercent.value).toBe(50.0)
    })

    it('resetRecipeState limpia los insumos y costos acumulados', () => {
      const activeProduct = ref<ProductRow | null>(mockProduct)
      const {
        recipeItems,
        recipeTotalCost,
        additionalCosts,
        resetRecipeState
      } = useAdminRecipes(activeProduct)

      recipeTotalCost.value = 35.0
      recipeItems.value = [
        {
          id: 1,
          product_id: 10,
          raw_material_id: 2,
          unit: 'g',
          quantity_used: 250
        }
      ]
      additionalCosts.value = { packaging: 5, utilities: 2, labor: 4 }

      resetRecipeState()

      expect(recipeItems.value.length).toBe(0)
      expect(recipeTotalCost.value).toBe(0)
      expect(additionalCosts.value.packaging).toBe(0)
    })
  })
})
