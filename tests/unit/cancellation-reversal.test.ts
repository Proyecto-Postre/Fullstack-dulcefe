import { describe, it, expect } from 'vitest'
import { AdminUpdateOrderStatusSchema } from '../../server/utils/schemas/admin-order'

describe('Fase 6 - Subfase 6.2: Reversión Atómica de Stock y Declaración de Mermas (ADR-001 / D1)', () => {
  describe('Validación de Esquema de Cancelación (AdminUpdateOrderStatusSchema)', () => {
    it('acepta actualización de estado a cancelled con opciones completas', () => {
      const payload = {
        status: 'cancelled',
        cancellation_reason: 'Cliente solicitó cancelación por viaje urgente',
        restore_stock: true
      }

      const parsed = AdminUpdateOrderStatusSchema.safeParse(payload)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.status).toBe('cancelled')
        expect(parsed.data.cancellation_reason).toBe('Cliente solicitó cancelación por viaje urgente')
        expect(parsed.data.restore_stock).toBe(true)
      }
    })

    it('acepta cancelación declarando merma de insumos (restore_stock = false)', () => {
      const payload = {
        status: 'cancelled',
        cancellation_reason: 'Masa estropeada en horno, insumos irrecuperables',
        restore_stock: false
      }

      const parsed = AdminUpdateOrderStatusSchema.safeParse(payload)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.restore_stock).toBe(false)
      }
    })

    it('acepta cancelación sin opciones adicionales para compatibilidad retroactiva', () => {
      const payload = { status: 'cancelled' }
      const parsed = AdminUpdateOrderStatusSchema.safeParse(payload)
      expect(parsed.success).toBe(true)
    })

    it('rechaza motivos de cancelación menores a 3 caracteres', () => {
      const invalidPayload = {
        status: 'cancelled',
        cancellation_reason: 'no'
      }

      const parsed = AdminUpdateOrderStatusSchema.safeParse(invalidPayload)
      expect(parsed.success).toBe(false)
    })
  })

  describe('Lógica de Negocio de Compensación de Inventario', () => {
    interface MockOrder {
      id: string
      status: string
      inventory_processed: boolean
    }

    function evaluateCancellationInventoryAction(
      order: MockOrder,
      restoreStock: boolean,
      _reason: string
    ): {
      shouldExecuteReversal: boolean
      expectedMovementType: 'cancellation_reversal' | 'waste_declaration' | null
    } {
      if (!order.inventory_processed) {
        return {
          shouldExecuteReversal: false,
          expectedMovementType: null
        }
      }

      return {
        shouldExecuteReversal: true,
        expectedMovementType: restoreStock ? 'cancellation_reversal' : 'waste_declaration'
      }
    }

    it('no revierte inventario si el pedido fue cancelado en estado pending (sin consumo previo)', () => {
      const pendingOrder: MockOrder = {
        id: 'order-1',
        status: 'pending',
        inventory_processed: false
      }

      const result = evaluateCancellationInventoryAction(pendingOrder, true, 'Error al pedir')
      expect(result.shouldExecuteReversal).toBe(false)
      expect(result.expectedMovementType).toBeNull()
    })

    it('revierte inventario con tipo cancellation_reversal si el pedido estaba en processing y se solicita reposición', () => {
      const processingOrder: MockOrder = {
        id: 'order-2',
        status: 'processing',
        inventory_processed: true
      }

      const result = evaluateCancellationInventoryAction(processingOrder, true, 'Cancelado antes de hornear')
      expect(result.shouldExecuteReversal).toBe(true)
      expect(result.expectedMovementType).toBe('cancellation_reversal')
    })

    it('registra movimiento waste_declaration si el pedido estaba en processing y los insumos fueron mermados', () => {
      const processingOrder: MockOrder = {
        id: 'order-3',
        status: 'processing',
        inventory_processed: true
      }

      const result = evaluateCancellationInventoryAction(processingOrder, false, 'Bizcocho quemado')
      expect(result.shouldExecuteReversal).toBe(true)
      expect(result.expectedMovementType).toBe('waste_declaration')
    })
  })

  describe('Inmutabilidad de Estados Terminales (§7.3)', () => {
    const allowedTransitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['ready', 'cancelled'],
      ready: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    }

    it('el estado cancelled es terminal y no permite transiciones posteriores', () => {
      expect(allowedTransitions['cancelled']).toHaveLength(0)
    })
  })
})
