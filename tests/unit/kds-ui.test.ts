import { describe, it, expect } from 'vitest'
import {
  calculateDeliveryUrgency,
  sortKdsOrdersByUrgency,
  aggregateBatchBakingRequirements,
  type KdsOrder
} from '../../app/utils/kds'

describe('KDS Utility Suite (Fase 6 / Subfase 6.3)', () => {
  describe('calculateDeliveryUrgency', () => {
    it('debe retornar nivel normal sin fecha límite si delivery_date es null', () => {
      const result = calculateDeliveryUrgency(null, null)
      expect(result.level).toBe('normal')
      expect(result.minutesRemaining).toBe(9999)
      expect(result.badgeLabel).toContain('Sin fecha')
    })

    it('debe clasificar como "overdue" si la hora límite ya pasó respecto a Lima (UTC-5)', () => {
      // Supongamos que ahora en Lima es 2026-09-07 a las 14:00 (19:00 UTC)
      const nowLima = new Date('2026-09-07T14:00:00-05:00').getTime()
      // Pedido pactado para las 13:00 de Lima
      const result = calculateDeliveryUrgency('2026-09-07', '13:00', nowLima)
      expect(result.level).toBe('overdue')
      expect(result.minutesRemaining).toBe(-60)
      expect(result.badgeLabel).toContain('Vencido')
      expect(result.badgeClass).toContain('bg-red-600')
    })

    it('debe clasificar como "urgent" si faltan 120 minutos o menos', () => {
      const nowLima = new Date('2026-09-07T14:00:00-05:00').getTime()
      // Pedido pactado para las 15:30 (faltan 90 mins)
      const result = calculateDeliveryUrgency('2026-09-07', '15:30', nowLima)
      expect(result.level).toBe('urgent')
      expect(result.minutesRemaining).toBe(90)
      expect(result.badgeLabel).toContain('Urgente')
      expect(result.badgeClass).toContain('bg-red-100')
    })

    it('debe clasificar como "warning" si faltan entre 121 y 240 minutos', () => {
      const nowLima = new Date('2026-09-07T14:00:00-05:00').getTime()
      // Pedido pactado para las 17:00 (faltan 180 mins)
      const result = calculateDeliveryUrgency('2026-09-07', '17:00', nowLima)
      expect(result.level).toBe('warning')
      expect(result.minutesRemaining).toBe(180)
      expect(result.badgeLabel).toContain('Atención')
      expect(result.badgeClass).toContain('bg-amber-100')
    })

    it('debe clasificar como "normal" si faltan más de 240 minutos (>4 horas)', () => {
      const nowLima = new Date('2026-09-07T14:00:00-05:00').getTime()
      // Pedido pactado para las 20:00 (faltan 360 mins = 6h)
      const result = calculateDeliveryUrgency('2026-09-07', '20:00', nowLima)
      expect(result.level).toBe('normal')
      expect(result.minutesRemaining).toBe(360)
      expect(result.badgeLabel).toContain('En tiempo')
    })
  })

  describe('sortKdsOrdersByUrgency', () => {
    it('debe ordenar las comandas de mayor urgencia a menor urgencia', () => {
      const nowLima = new Date('2026-09-07T10:00:00-05:00').getTime()

      const orders: KdsOrder[] = [
        {
          id: 'ord-normal',
          short_id: 'ord-norm',
          customer_name: 'Cliente Normal',
          status: 'pending',
          delivery_date: '2026-09-07',
          delivery_time: '18:00', // 8h restante
          created_at: '2026-09-07T08:00:00Z',
          items: []
        },
        {
          id: 'ord-overdue',
          short_id: 'ord-over',
          customer_name: 'Cliente Vencido',
          status: 'pending',
          delivery_date: '2026-09-07',
          delivery_time: '09:00', // -60m
          created_at: '2026-09-07T07:00:00Z',
          items: []
        },
        {
          id: 'ord-urgent',
          short_id: 'ord-urgt',
          customer_name: 'Cliente Urgente',
          status: 'pending',
          delivery_date: '2026-09-07',
          delivery_time: '11:00', // 60m restante
          created_at: '2026-09-07T08:30:00Z',
          items: []
        }
      ]

      const sorted = sortKdsOrdersByUrgency(orders, nowLima)
      expect(sorted[0]?.id).toBe('ord-overdue')
      expect(sorted[1]?.id).toBe('ord-urgent')
      expect(sorted[2]?.id).toBe('ord-normal')
    })
  })

  describe('aggregateBatchBakingRequirements', () => {
    it('debe consolidar insumos de múltiples órdenes activas multiplicando por cantidad de producto', () => {
      const orders: KdsOrder[] = [
        {
          id: '1',
          short_id: '1',
          customer_name: 'Cliente 1',
          status: 'pending',
          delivery_date: null,
          delivery_time: null,
          created_at: '2026-09-07T00:00:00Z',
          items: [
            {
              product_id: 101,
              product_name: 'Torta de Chocolate',
              quantity: 2,
              recipe: [
                { material_id: 1, material_name: 'Harina Sin Preparar', unit: 'gr', quantity_used: 250 },
                { material_id: 2, material_name: 'Cacao en Polvo', unit: 'gr', quantity_used: 100 }
              ]
            }
          ]
        },
        {
          id: '2',
          short_id: '2',
          customer_name: 'Cliente 2',
          status: 'processing',
          delivery_date: null,
          delivery_time: null,
          created_at: '2026-09-07T00:00:00Z',
          items: [
            {
              product_id: 102,
              product_name: 'Queque Vainilla',
              quantity: 3,
              recipe: [
                { material_id: 1, material_name: 'Harina Sin Preparar', unit: 'gr', quantity_used: 200 },
                { material_id: 3, material_name: 'Esencia Vainilla', unit: 'ml', quantity_used: 15 }
              ]
            }
          ]
        },
        {
          id: '3',
          short_id: '3',
          customer_name: 'Cliente 3',
          status: 'completed', // Ya completado, no debe entrar al Mise en place
          delivery_date: null,
          delivery_time: null,
          created_at: '2026-09-07T00:00:00Z',
          items: [
            {
              product_id: 101,
              product_name: 'Torta de Chocolate',
              quantity: 10,
              recipe: [
                { material_id: 1, material_name: 'Harina Sin Preparar', unit: 'gr', quantity_used: 250 }
              ]
            }
          ]
        }
      ]

      const summary = aggregateBatchBakingRequirements(orders)

      // Harina: Order 1 (250 * 2 = 500) + Order 2 (200 * 3 = 600) = 1100
      const harina = summary.find((s) => s.material_id === 1)
      expect(harina).toBeDefined()
      expect(harina?.total_quantity).toBe(1100)

      // Cacao: Order 1 (100 * 2 = 200)
      const cacao = summary.find((s) => s.material_id === 2)
      expect(cacao).toBeDefined()
      expect(cacao?.total_quantity).toBe(200)

      // Vainilla: Order 2 (15 * 3 = 45)
      const vainilla = summary.find((s) => s.material_id === 3)
      expect(vainilla).toBeDefined()
      expect(vainilla?.total_quantity).toBe(45)

      // Deben estar ordenados alfabéticamente
      expect(summary[0]?.material_name).toBe('Cacao en Polvo')
      expect(summary[1]?.material_name).toBe('Esencia Vainilla')
      expect(summary[2]?.material_name).toBe('Harina Sin Preparar')
    })
  })
})
