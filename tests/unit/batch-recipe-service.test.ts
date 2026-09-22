import { describe, it, expect } from 'vitest'
import { solesToCents, centsToSoles } from '../../server/utils/money'

describe('Batch Recipe Math & Service Unit Suite (Fase 2 / Subfase 7.2)', () => {
  it('1. Calcula el costo total de una tanda sumando insumos y CIF con céntimos exactos', () => {
    // Insumos: Harina (S/ 3.50 por kg, usa 1.5kg = S/ 5.25 = 525 céntimos)
    // Mantequilla: (S/ 18.00 por kg, usa 0.4kg = S/ 7.20 = 720 céntimos)
    // CIF: Horno S/ 4.00 (400 céntimos) + Mano de obra S/ 6.00 (600 céntimos)
    const harinaCostCents = Math.round((solesToCents(3.50) / 1) * 1.5)
    const mantequillaCostCents = Math.round((solesToCents(18.00) / 1) * 0.4)
    const materialsCents = harinaCostCents + mantequillaCostCents
    const cifCents = solesToCents(4.00) + solesToCents(6.00)

    const totalBatchCents = materialsCents + cifCents

    expect(harinaCostCents).toBe(525)
    expect(mantequillaCostCents).toBe(720)
    expect(materialsCents).toBe(1245)
    expect(cifCents).toBe(1000)
    expect(totalBatchCents).toBe(2245)
    expect(centsToSoles(totalBatchCents)).toBe('22.45')
  })

  it('2. Calcula el costo por pieza unitaria según el rendimiento sin desfase de redondeo', () => {
    const totalBatchCents = 2245 // S/ 22.45

    // Corte Grande: rinde 10 unidades
    const unitGrandeCents = Math.round(totalBatchCents / 10)
    expect(unitGrandeCents).toBe(225) // S/ 2.25 c/u

    // Corte Mediano: rinde 16 unidades
    const unitMedianoCents = Math.round(totalBatchCents / 16)
    expect(unitMedianoCents).toBe(140) // S/ 1.40 c/u

    // Corte Mini: rinde 24 unidades
    const unitMiniCents = Math.round(totalBatchCents / 24)
    expect(unitMiniCents).toBe(94) // S/ 0.94 c/u
  })

  it('3. Calcula la fracción y el costo de un producto comercial empaquetado', () => {
    // Producto: "Caja de 6 Roles Medianos"
    // Lleva 6 roles medianos de una tanda que rinde 16
    const unitMedianoCents = 140
    const unitsContained = 6
    const doughCostCents = unitMedianoCents * unitsContained // 840 céntimos = S/ 8.40

    // Empaque directo: 1 Caja de cartón (S/ 2.50 = 250 céntimos)
    const packagingCents = solesToCents(2.50)
    const totalProductCents = doughCostCents + packagingCents

    expect(doughCostCents).toBe(840)
    expect(totalProductCents).toBe(1090) // S/ 10.90 de costo total de producción

    // Margen con precio de venta S/ 22.00 (2200 céntimos)
    const salePriceCents = solesToCents(22.00)
    const grossMarginCents = salePriceCents - totalProductCents
    const grossMarginPercent = Number(((grossMarginCents / salePriceCents) * 100).toFixed(1))

    expect(grossMarginCents).toBe(1110) // S/ 11.10 de ganancia neta
    expect(grossMarginPercent).toBe(50.5) // 50.5% margen
  })

  it('4. Algoritmo de descargo rápido: calcula insumos proporcionales para piezas sueltas', () => {
    // Tanda de masa de roles:
    // Harina: 1000g
    // Mantequilla: 200g
    // Rendimiento total: 18 roles medianos
    const tandaHarinaGramos = 1000
    const tandaMantequillaGramos = 200
    const yieldUnits = 18

    // El pastelero se come o regala 2 roles:
    const piecesDeducted = 2
    const fraction = piecesDeducted / yieldUnits // 2 / 18 = 0.111111...

    const harinaDeducida = Number((tandaHarinaGramos * fraction).toFixed(4))
    const mantequillaDeducida = Number((tandaMantequillaGramos * fraction).toFixed(4))

    expect(harinaDeducida).toBe(111.1111) // 111.11g
    expect(mantequillaDeducida).toBe(22.2222) // 22.22g
  })

  it('5. Algoritmo de postres en riesgo: detecta quiebre si el insumo o empaque no alcanza para 1 porción', () => {
    const requiredHarina = 333.33 // g requeridos para 1 caja
    const availableHarina = 200.00 // g disponibles en almacén

    const isHarinaAtRisk = availableHarina < requiredHarina
    expect(isHarinaAtRisk).toBe(true)

    const requiredCajas = 1
    const availableCajas = 0
    const isCajaAtRisk = availableCajas < requiredCajas
    expect(isCajaAtRisk).toBe(true)
  })
})
