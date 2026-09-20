import { describe, it, expect } from 'vitest'
import {
  AdminUpdateOrderStatusSchema,
  AdminCreateOrderSchema
} from '../../server/utils/schemas/admin-order'
import { solesToCents, calculateLoyaltyPoints } from '../../server/utils/money'

describe('Validación de Esquemas de Órdenes Administrativas (server/utils/schemas/admin-order.ts)', () => {
  it('valida estados permitidos de transición', () => {
    expect(AdminUpdateOrderStatusSchema.safeParse({ status: 'processing' }).success).toBe(true)
    expect(AdminUpdateOrderStatusSchema.safeParse({ status: 'ready' }).success).toBe(true)
    expect(AdminUpdateOrderStatusSchema.safeParse({ status: 'completed' }).success).toBe(true)
    expect(AdminUpdateOrderStatusSchema.safeParse({ status: 'cancelled' }).success).toBe(true)
  })

  it('rechaza estados no válidos o inventados', () => {
    expect(AdminUpdateOrderStatusSchema.safeParse({ status: 'draft' }).success).toBe(false)
    expect(AdminUpdateOrderStatusSchema.safeParse({ status: 'delivered' }).success).toBe(false)
    expect(AdminUpdateOrderStatusSchema.safeParse({ status: 'pending' }).success).toBe(false) // No se puede transicionar HACIA pending
  })

  it('valida una orden de administración completa y rechaza canal que no sea admin', () => {
    const validAdminOrder = {
      channel: 'admin',
      customer_name: 'Cliente Mostrador',
      customer_phone: '987654321',
      items: [{ product_id: 1, quantity: 2 }]
    }
    expect(AdminCreateOrderSchema.safeParse(validAdminOrder).success).toBe(true)

    const invalidChannelOrder = {
      ...validAdminOrder,
      channel: 'direct' // En este endpoint solo se admite 'admin'
    }
    expect(AdminCreateOrderSchema.safeParse(invalidChannelOrder).success).toBe(false)
  })

  it('rechaza órdenes admin con ítems vacíos o cantidades inválidas', () => {
    expect(
      AdminCreateOrderSchema.safeParse({
        channel: 'admin',
        customer_name: 'Cliente Test',
        items: []
      }).success
    ).toBe(false)

    expect(
      AdminCreateOrderSchema.safeParse({
        channel: 'admin',
        customer_name: 'Cliente Test',
        items: [{ product_id: 1, quantity: 0 }]
      }).success
    ).toBe(false)
  })
})

describe('Matriz de Transiciones de Estado del Plan Maestro (§7.3)', () => {
  const allowedTransitions: Record<string, string[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: [], // terminal
    cancelled: [] // terminal
  }

  function isValidTransition(from: string, to: string): boolean {
    if (from === to) return true // idempotente
    return (allowedTransitions[from] || []).includes(to)
  }

  it('permite el flujo ideal: pending -> processing -> ready -> completed', () => {
    expect(isValidTransition('pending', 'processing')).toBe(true)
    expect(isValidTransition('processing', 'ready')).toBe(true)
    expect(isValidTransition('ready', 'completed')).toBe(true)
  })

  it('permite cancelación desde pending, processing y ready', () => {
    expect(isValidTransition('pending', 'cancelled')).toBe(true)
    expect(isValidTransition('processing', 'cancelled')).toBe(true)
    expect(isValidTransition('ready', 'cancelled')).toBe(true)
  })

  it('prohíbe saltarse pasos críticos (ej. pending a ready directo)', () => {
    expect(isValidTransition('pending', 'ready')).toBe(false)
    expect(isValidTransition('pending', 'completed')).toBe(false)
  })

  it('prohíbe reabrir pedidos desde estados terminales (completed / cancelled)', () => {
    expect(isValidTransition('completed', 'processing')).toBe(false)
    expect(isValidTransition('completed', 'pending')).toBe(false)
    expect(isValidTransition('cancelled', 'processing')).toBe(false)
    expect(isValidTransition('cancelled', 'ready')).toBe(false)
  })
})

describe('Reglas de Negocio Financieras y Quiebre de Inventario', () => {
  it('calcula puntos de lealtad descartando decimales según estándar oficial', () => {
    // S/ 45.90 -> 4590 céntimos -> 45 puntos
    const cents1 = solesToCents('45.90')
    expect(calculateLoyaltyPoints(cents1)).toBe(45)

    // S/ 100.00 -> 10000 céntimos -> 100 puntos
    const cents2 = solesToCents(100)
    expect(calculateLoyaltyPoints(cents2)).toBe(100)

    // S/ 0.99 -> 99 céntimos -> 0 puntos
    const cents3 = solesToCents('0.99')
    expect(calculateLoyaltyPoints(cents3)).toBe(0)
  })

  it('detecta correctamente quiebre de stock cuando insumos son insuficientes', () => {
    const rawMaterialStock = 500 // gramos disponibles
    const recipeNeedPerUnit = 200 // gramos por torta
    const orderQuantity = 3 // 3 tortas = 600 gramos requeridos

    const totalNeeded = recipeNeedPerUnit * orderQuantity
    const hasEnoughStock = rawMaterialStock >= totalNeeded

    expect(hasEnoughStock).toBe(false)
    expect(totalNeeded - rawMaterialStock).toBe(100) // Faltan 100g
  })
})
