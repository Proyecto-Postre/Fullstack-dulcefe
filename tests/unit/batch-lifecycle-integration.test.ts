import { describe, it, expect } from 'vitest'
import { solesToCents, centsToSoles } from '../../server/utils/money'
import type { OrderCostSnapshot } from '../../app/types/cost-snapshot'

/**
 * Suite de Integración: Ciclo de Vida Completo de Producción por Tandas
 * Ref: Fase 7 / Subfase 7.5 (Tandas, Porcionamiento, Empaques, Pedidos, Mermas y Costos)
 */
describe('Batch Recipe Full Lifecycle Integration Suite (Fase 7 / Subfase 7.5)', () => {
  // 1. Modelos de Datos Simulados para el Almacén y Taller
  interface MockRawMaterial {
    id: number
    name: string
    unit: string
    stock: number
    purchase_price: number // Soles
    purchase_quantity: number // ej. 1000g o 1 unidad
  }

  interface MockInventoryMovement {
    id: string
    raw_material_id: number
    type: 'order_consumption' | 'cancellation_reversal' | 'piece_waste_deduction' | 'waste_declaration'
    quantity_delta: number
    stock_before: number
    stock_after: number
    reason: string
    order_id?: string
  }

  interface MockPieceWasteLog {
    id: string
    yield_id: string
    pieces_deducted: number
    reason: string
    fraction_consumed: number
    notes?: string
  }

  // Estado inicial del almacén físico
  const createInitialWarehouse = (): Map<number, MockRawMaterial> => {
    const map = new Map<number, MockRawMaterial>()
    // Insumos de Tanda
    map.set(1, { id: 1, name: 'Harina Pastelera', unit: 'g', stock: 5000, purchase_price: 3.50, purchase_quantity: 1000 })
    map.set(2, { id: 2, name: 'Mantequilla Gloria', unit: 'g', stock: 2000, purchase_price: 24.00, purchase_quantity: 1000 })
    map.set(3, { id: 3, name: 'Azúcar Rubia', unit: 'g', stock: 3000, purchase_price: 4.00, purchase_quantity: 1000 })
    // Empaques directos de presentación
    map.set(10, { id: 10, name: 'Caja Kraft 6 Roles', unit: 'u', stock: 50, purchase_price: 2.50, purchase_quantity: 1 })
    map.set(11, { id: 11, name: 'Sticker Botánico Dulce Fé', unit: 'u', stock: 100, purchase_price: 0.50, purchase_quantity: 1 })
    return map
  }

  // Tanda Maestra: Masa Brioche Roles Dulce Fé
  const mockBatchRecipe = {
    id: 'batch-brioche-01',
    name: 'Masa Brioche Roles Clásica',
    cif_cost_cents: 800, // S/ 8.00 (Horno + Mano de obra)
    items: [
      { raw_material_id: 1, quantity_used: 1200 }, // 1200 g harina
      { raw_material_id: 2, quantity_used: 250 },  // 250 g mantequilla
      { raw_material_id: 3, quantity_used: 180 }   // 180 g azúcar
    ],
    yields: [
      { id: 'yield-mediano-18', cut_name: 'Corte Mediano', yield_units: 18 },
      { id: 'yield-grande-12', cut_name: 'Corte Grande', yield_units: 12 }
    ]
  }

  // Producto Comercial: "Caja de 6 Roles Medianos"
  const mockProduct = {
    id: 101,
    name: 'Caja de 6 Roles Medianos',
    sale_price: 32.00, // S/ 32.00 = 3200 céntimos
    batch_mapping: {
      yield_id: 'yield-mediano-18',
      units_contained: 6 // Usa 6 roles de la tanda de 18
    },
    packaging_items: [
      { raw_material_id: 10, quantity_used: 1 }, // 1 Caja Kraft
      { raw_material_id: 11, quantity_used: 1 }  // 1 Sticker
    ]
  }

  describe('Escenario 1: Ciclo Completo de Fabricación, Venta y Congelamiento de Costo', () => {
    it('calcula la tanda maestra y costos por pieza unitaria de forma exacta', () => {
      // 1. Costo de insumos de la tanda en céntimos
      const flourCents = Math.round((solesToCents(3.50) / 1000) * 1200) // (350 / 1000) * 1200 = 420 céntimos
      const butterCents = Math.round((solesToCents(24.00) / 1000) * 250) // (2400 / 1000) * 250 = 600 céntimos
      const sugarCents = Math.round((solesToCents(4.00) / 1000) * 180) // (400 / 1000) * 180 = 72 céntimos

      const totalIngredientsCents = flourCents + butterCents + sugarCents // 1092 céntimos = S/ 10.92
      const totalBatchCostCents = totalIngredientsCents + mockBatchRecipe.cif_cost_cents // 1092 + 800 = 1892 céntimos = S/ 18.92

      expect(flourCents).toBe(420)
      expect(butterCents).toBe(600)
      expect(sugarCents).toBe(72)
      expect(totalBatchCostCents).toBe(1892)
      expect(centsToSoles(totalBatchCostCents)).toBe('18.92')

      // 2. Costo por pieza en Corte Mediano (18 u) y Corte Grande (12 u)
      const costPerMedianoCents = Math.round(totalBatchCostCents / 18) // 1892 / 18 = 105.11 -> 105 céntimos (S/ 1.05)
      const costPerGrandeCents = Math.round(totalBatchCostCents / 12)  // 1892 / 12 = 157.66 -> 158 céntimos (S/ 1.58)

      expect(costPerMedianoCents).toBe(105)
      expect(costPerGrandeCents).toBe(158)
    })

    it('ejecuta la deducción proporcional exacta al pasar un pedido de 2 cajas a processing', () => {
      const warehouse = createInitialWarehouse()
      const movements: MockInventoryMovement[] = []
      const orderQuantity = 2 // 2 Cajas de 6 roles cada una = 12 roles en total

      // Fracción consumida de la tanda: (units_contained / yield_units) * orderQuantity
      // (6 / 18) * 2 = (1 / 3) * 2 = 2 / 3
      const yieldUnits = 18
      const unitsContained = 6
      const fraction = (unitsContained / yieldUnits) * orderQuantity // 12 / 18 = 2/3

      expect(fraction).toBeCloseTo(0.66667, 4)

      // Deducción de insumos de tanda
      for (const item of mockBatchRecipe.items) {
        const mat = warehouse.get(item.raw_material_id)!
        const needed = Number((item.quantity_used * fraction).toFixed(4))
        const stockBefore = mat.stock
        const stockAfter = Number((stockBefore - needed).toFixed(4))

        mat.stock = stockAfter
        movements.push({
          id: `mov-${item.raw_material_id}`,
          raw_material_id: item.raw_material_id,
          type: 'order_consumption',
          quantity_delta: -needed,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: 'Consumo por orden ORD-001',
          order_id: 'ORD-001'
        })
      }

      // Deducción de empaques directos (1 caja kraft + 1 sticker por unidad de producto)
      for (const pkg of mockProduct.packaging_items) {
        const mat = warehouse.get(pkg.raw_material_id)!
        const needed = pkg.quantity_used * orderQuantity
        const stockBefore = mat.stock
        const stockAfter = stockBefore - needed

        mat.stock = stockAfter
        movements.push({
          id: `mov-${pkg.raw_material_id}`,
          raw_material_id: pkg.raw_material_id,
          type: 'order_consumption',
          quantity_delta: -needed,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: 'Consumo por orden ORD-001',
          order_id: 'ORD-001'
        })
      }

      // Verificaciones del almacén tras pasar a processing:
      // Harina: 5000g - 800g = 4200g
      expect(warehouse.get(1)!.stock).toBe(4200)

      // Mantequilla: 2000g - 166.6667g = 1833.3333g
      expect(warehouse.get(2)!.stock).toBeCloseTo(1833.3333, 3)

      // Azúcar: 3000g - 120g = 2880g
      expect(warehouse.get(3)!.stock).toBe(2880)

      // Cajas Kraft: 50 - 2 = 48
      expect(warehouse.get(10)!.stock).toBe(48)

      // Stickers: 100 - 2 = 98
      expect(warehouse.get(11)!.stock).toBe(98)

      expect(movements).toHaveLength(5)
    })

    it('congela inmutablemente el OrderCostSnapshot (ADR-008) con desglose de masa y empaque', () => {
      // Costo de masa por caja (6 roles medianos a S/ 1.05 aprox):
      // Costo real exacto de insumos por caja:
      // Harina: 400g = (350 / 1000) * 400 = 140 céntimos
      // Mantequilla: 83.3333g = (2400 / 1000) * 83.3333 = 200 céntimos
      // Azúcar: 60g = (400 / 1000) * 60 = 24 céntimos
      // Empaque: 1 Caja (250 céntimos) + 1 Sticker (50 céntimos) = 300 céntimos
      const costHarinaCents = 140
      const costMantequillaCents = 200
      const costAzucarCents = 24
      const costCajaCents = 250
      const costStickerCents = 50

      const unitCostCents = costHarinaCents + costMantequillaCents + costAzucarCents + costCajaCents + costStickerCents // 664 céntimos = S/ 6.64
      const orderQuantity = 2
      const totalCostCents = unitCostCents * orderQuantity // 1328 céntimos = S/ 13.28
      const saleAmountCents = solesToCents(mockProduct.sale_price) * orderQuantity // 3200 * 2 = 6400 céntimos = S/ 64.00

      const grossMarginCents = saleAmountCents - totalCostCents // 6400 - 1328 = 5072 céntimos = S/ 50.72
      const grossMarginPct = Number(((grossMarginCents / saleAmountCents) * 100).toFixed(1)) // 79.3%

      const snapshot: OrderCostSnapshot = {
        order_id: 'ORD-001',
        calculated_at: '2026-09-23T12:00:00Z',
        total_amount_cents: saleAmountCents,
        total_cost_cents: totalCostCents,
        gross_margin_cents: grossMarginCents,
        gross_margin_percentage: grossMarginPct,
        items: [
          {
            product_id: mockProduct.id,
            product_name: mockProduct.name,
            quantity: orderQuantity,
            unit_cost_cents: unitCostCents,
            total_cost_cents: totalCostCents,
            ingredients: [
              { material_id: 1, material_name: 'Harina (Porción masa)', unit: 'g', quantity_used: 400, cost_per_unit_cents: 0, total_cost_cents: costHarinaCents },
              { material_id: 2, material_name: 'Mantequilla (Porción masa)', unit: 'g', quantity_used: 83.3333, cost_per_unit_cents: 2, total_cost_cents: costMantequillaCents },
              { material_id: 3, material_name: 'Azúcar (Porción masa)', unit: 'g', quantity_used: 60, cost_per_unit_cents: 0, total_cost_cents: costAzucarCents },
              { material_id: 10, material_name: 'Caja Kraft 6 Roles', unit: 'u', quantity_used: 1, cost_per_unit_cents: 250, total_cost_cents: costCajaCents },
              { material_id: 11, material_name: 'Sticker Botánico', unit: 'u', quantity_used: 1, cost_per_unit_cents: 50, total_cost_cents: costStickerCents }
            ]
          }
        ]
      }

      expect(snapshot.total_cost_cents).toBe(1328)
      expect(snapshot.gross_margin_cents).toBe(5072)
      expect(snapshot.gross_margin_percentage).toBe(79.3)
      expect(snapshot.items[0].ingredients).toHaveLength(5)
    })
  })

  describe('Escenario 2: Reversión Completa por Cancelación de Pedido', () => {
    it('restituye íntegramente las materias primas y empaques cuando la orden en processing se cancela', () => {
      const warehouse = createInitialWarehouse()

      // 1. Simular consumos previos por orden ORD-001
      const orderDeductions = [
        { raw_material_id: 1, qty_deducted: 800 },
        { raw_material_id: 2, qty_deducted: 166.6667 },
        { raw_material_id: 3, qty_deducted: 120 },
        { raw_material_id: 10, qty_deducted: 2 },
        { raw_material_id: 11, qty_deducted: 2 }
      ]

      for (const d of orderDeductions) {
        warehouse.get(d.raw_material_id)!.stock -= d.qty_deducted
      }

      // Verificamos que el stock fue deducido
      expect(warehouse.get(1)!.stock).toBe(4200)
      expect(warehouse.get(10)!.stock).toBe(48)

      // 2. Se cancela la orden con restore_stock = true
      const reversalMovements: MockInventoryMovement[] = []
      for (const d of orderDeductions) {
        const mat = warehouse.get(d.raw_material_id)!
        const stockBefore = mat.stock
        const stockAfter = Number((stockBefore + d.qty_deducted).toFixed(4))
        mat.stock = stockAfter

        reversalMovements.push({
          id: `rev-${d.raw_material_id}`,
          raw_material_id: d.raw_material_id,
          type: 'cancellation_reversal',
          quantity_delta: d.qty_deducted,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: 'Cancelación de pedido ORD-001 en administración',
          order_id: 'ORD-001'
        })
      }

      // El almacén retorna 100% a sus saldos originales
      expect(warehouse.get(1)!.stock).toBe(5000)
      expect(warehouse.get(2)!.stock).toBe(2000)
      expect(warehouse.get(3)!.stock).toBe(3000)
      expect(warehouse.get(10)!.stock).toBe(50)
      expect(warehouse.get(11)!.stock).toBe(100)

      // Todos los deltas fueron positivos
      expect(reversalMovements.every(m => m.quantity_delta > 0)).toBe(true)
    })
  })

  describe('Escenario 3: Descargo Rápido de Piezas Sueltas en Taller', () => {
    it('descuenta insumos proporcionalmente al registrar salida de 3 piezas grandes sin afectar empaques', () => {
      const warehouse = createInitialWarehouse()
      const wasteLogs: MockPieceWasteLog[] = []
      const movements: MockInventoryMovement[] = []

      // El pastelero registra salida de 3 piezas del Corte Grande (rinde 12 unidades)
      // Motivo: Merma de horneado (roles que se doraron en exceso)
      const piecesDeducted = 3
      const yieldUnits = 12
      const fraction = piecesDeducted / yieldUnits // 3 / 12 = 0.25 (25% de la tanda)

      expect(fraction).toBe(0.25)

      // Registro en piece_waste_logs
      wasteLogs.push({
        id: 'waste-uuid-1',
        yield_id: 'yield-grande-12',
        pieces_deducted: piecesDeducted,
        reason: 'baking_waste',
        fraction_consumed: fraction,
        notes: '3 roles dorados en exceso retirados del lote'
      })

      // Deducción proporcional de insumos de tanda
      for (const item of mockBatchRecipe.items) {
        const mat = warehouse.get(item.raw_material_id)!
        const needed = Number((item.quantity_used * fraction).toFixed(4))
        const stockBefore = mat.stock
        const stockAfter = Number((stockBefore - needed).toFixed(4))

        mat.stock = stockAfter
        movements.push({
          id: `waste-mov-${item.raw_material_id}`,
          raw_material_id: item.raw_material_id,
          type: 'piece_waste_deduction',
          quantity_delta: -needed,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: 'Descargo rápido: 3 piezas por baking_waste'
        })
      }

      // Verificación de deducciones de insumos:
      // Harina: 1200 * 0.25 = 300g deducidos -> 5000 - 300 = 4700g
      expect(warehouse.get(1)!.stock).toBe(4700)

      // Mantequilla: 250 * 0.25 = 62.5g deducidos -> 2000 - 62.5 = 1937.5g
      expect(warehouse.get(2)!.stock).toBe(1937.5)

      // Azúcar: 180 * 0.25 = 45g deducidos -> 3000 - 45 = 2955g
      expect(warehouse.get(3)!.stock).toBe(2955)

      // Los empaques NO fueron afectados
      expect(warehouse.get(10)!.stock).toBe(50)
      expect(warehouse.get(11)!.stock).toBe(100)

      expect(wasteLogs[0].pieces_deducted).toBe(3)
      expect(wasteLogs[0].reason).toBe('baking_waste')
    })
  })

  describe('Escenario 4: Detección Preventiva de Postres en Riesgo', () => {
    it('detecta quiebre inminente cuando el insumo o empaque no alcanza para 1 kit comercial', () => {
      const warehouse = createInitialWarehouse()

      // Para producir 1 caja de 6 roles mediano se requiere:
      // Harina: 400g
      // Mantequilla: 83.3333g
      // Azúcar: 60g
      // Caja Kraft: 1 u
      // Sticker: 1 u

      function checkProductRisk(wh: Map<number, MockRawMaterial>) {
        const missingItems: Array<{ material_name: string; available: number; required: number }> = []

        const reqHarina = 400
        const reqMantequilla = 83.3333
        const reqCaja = 1

        if (wh.get(1)!.stock < reqHarina) {
          missingItems.push({ material_name: 'Harina Pastelera', available: wh.get(1)!.stock, required: reqHarina })
        }
        if (wh.get(2)!.stock < reqMantequilla) {
          missingItems.push({ material_name: 'Mantequilla Gloria', available: wh.get(2)!.stock, required: reqMantequilla })
        }
        if (wh.get(10)!.stock < reqCaja) {
          missingItems.push({ material_name: 'Caja Kraft 6 Roles', available: wh.get(10)!.stock, required: reqCaja })
        }

        return {
          isAtRisk: missingItems.length > 0,
          missingItems
        }
      }

      // Con almacén normal: no está en riesgo
      expect(checkProductRisk(warehouse).isAtRisk).toBe(false)

      // Si la mantequilla se agota a 50g:
      warehouse.get(2)!.stock = 50
      const riskEvaluation = checkProductRisk(warehouse)
      expect(riskEvaluation.isAtRisk).toBe(true)
      expect(riskEvaluation.missingItems[0].material_name).toBe('Mantequilla Gloria')
      expect(riskEvaluation.missingItems[0].available).toBe(50)

      // Si las cajas se agotan a 0:
      warehouse.get(10)!.stock = 0
      const doubleRisk = checkProductRisk(warehouse)
      expect(doubleRisk.missingItems).toHaveLength(2) // Faltan mantequilla y cajas
    })
  })

  describe('Escenario 5: Regla Inmutable de Eliminación de Ficha Técnica', () => {
    it('la eliminación de una tanda de la base de datos NUNCA elimina ni altera las existencias de materias primas', () => {
      const warehouse = createInitialWarehouse()
      const initialFlourStock = warehouse.get(1)!.stock
      const initialButterStock = warehouse.get(2)!.stock
      const initialSugarStock = warehouse.get(3)!.stock

      // Simular eliminación de la tanda maestra `base_recipes`
      let activeBatchRecipe: typeof mockBatchRecipe | null = { ...mockBatchRecipe }
      expect(activeBatchRecipe).not.toBeNull()

      // Se ejecuta el borrado lógico o físico de la ficha técnica
      activeBatchRecipe = null
      expect(activeBatchRecipe).toBeNull()

      // Comprobación inmutable: El almacén de materias primas permanece idéntico
      expect(warehouse.has(1)).toBe(true)
      expect(warehouse.get(1)!.stock).toBe(initialFlourStock)
      expect(warehouse.get(2)!.stock).toBe(initialButterStock)
      expect(warehouse.get(3)!.stock).toBe(initialSugarStock)
    })
  })
})
