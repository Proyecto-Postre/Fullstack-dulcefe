import { describe, it, expect } from 'vitest'
import { solesToCents, centsToSoles } from '../../server/utils/money'

describe('Servicios de Dominio de Fase 3 (PR-3e): Lógica de Escandallos y Aritmética Exacta', () => {
  it('calcula el costo por gramo y el costo total de un ingrediente sin perder decimales', () => {
    // Harina: Costo S/ 85.00 por saco de 50,000 gramos (50 kg)
    const purchasePriceSoles = 85.00
    const purchaseQuantityGrams = 50000
    const quantityUsedGrams = 450 // para un bizcocho

    const purchasePriceCents = solesToCents(purchasePriceSoles) // 8500 céntimos
    const costPerGramCents = purchasePriceCents / purchaseQuantityGrams // 0.17 céntimos/g

    const itemCostCents = Math.round(costPerGramCents * quantityUsedGrams) // 76.5 -> 77 céntimos
    const itemCostSoles = centsToSoles(itemCostCents)

    expect(itemCostCents).toBe(77)
    expect(itemCostSoles).toBe('0.77')
  })

  it('calcula la suma exacta de una receta compuesta por múltiples insumos', () => {
    // Insumo 1: 77 céntimos
    // Insumo 2: 250 céntimos (S/ 2.50)
    // Insumo 3: 410 céntimos (S/ 4.10)
    const item1Cents = 77
    const item2Cents = 250
    const item3Cents = 410

    const totalCents = item1Cents + item2Cents + item3Cents // 737 céntimos
    const totalSoles = centsToSoles(totalCents)

    expect(totalCents).toBe(737)
    expect(totalSoles).toBe('7.37')
  })

  it('valida que el ajuste de stock calcule la variación correcta (delta)', () => {
    const stockBefore = 5000 // 5 kg
    const newStock = 4200 // conteo físico real: 4.2 kg
    const delta = newStock - stockBefore // -800 gramos de merma

    expect(delta).toBe(-800)
  })
})
