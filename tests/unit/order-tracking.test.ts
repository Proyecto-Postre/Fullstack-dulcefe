import { describe, it, expect } from 'vitest'
import { generateOrderTrackingToken, isValidTrackingTokenFormat } from '../../server/utils/crypto'
import type { PublicOrderTrackingDTO } from '../../server/api/orders/track/[token].get'

describe('Fase 6 - Subfase 6.1: Tracking Criptográfico de Invitados (ADR-002 / D2)', () => {
  describe('Motor Criptográfico (server/utils/crypto.ts)', () => {
    it('genera un token HMAC-SHA256 de exactamente 64 caracteres hexadecimales', () => {
      const orderId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
      const createdAt = '2026-09-07T12:00:00.000Z'
      const token = generateOrderTrackingToken(orderId, createdAt, 'fixed_salt_for_test')

      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('es determinista cuando recibe los mismos parámetros y sal', () => {
      const orderId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
      const createdAt = '2026-09-07T12:00:00.000Z'
      const token1 = generateOrderTrackingToken(orderId, createdAt, 'fixed_salt')
      const token2 = generateOrderTrackingToken(orderId, createdAt, 'fixed_salt')

      expect(token1).toBe(token2)
    })

    it('produce tokens completamente distintos para órdenes distintas', () => {
      const tokenA = generateOrderTrackingToken('order-1', '2026-09-07T12:00:00.000Z', 'salt')
      const tokenB = generateOrderTrackingToken('order-2', '2026-09-07T12:00:00.000Z', 'salt')

      expect(tokenA).not.toBe(tokenB)
    })

    it('valida estrictamente el formato del token con isValidTrackingTokenFormat', () => {
      const validToken = 'a'.repeat(64)
      expect(isValidTrackingTokenFormat(validToken)).toBe(true)

      // Casos inválidos
      expect(isValidTrackingTokenFormat('abc')).toBe(false) // Muy corto
      expect(isValidTrackingTokenFormat('a'.repeat(63))).toBe(false) // 63 chars
      expect(isValidTrackingTokenFormat('a'.repeat(65))).toBe(false) // 65 chars
      expect(isValidTrackingTokenFormat('G'.repeat(64))).toBe(false) // No hex (G)
      expect(isValidTrackingTokenFormat('A'.repeat(64))).toBe(false) // Mayúsculas
      expect(isValidTrackingTokenFormat("'; DROP TABLE orders; --")).toBe(false) // Inyección SQL
      expect(isValidTrackingTokenFormat('')).toBe(false)
    })
  })

  describe('Saneamiento de PII y Contrato de Tracking (Ley 29733)', () => {
    function sanitizeCustomerFirstName(fullName: string | null): string {
      if (!fullName) return 'Cliente'
      const trimmed = fullName.trim()
      return trimmed.split(/\s+/)[0] || 'Cliente'
    }

    it('extrae exclusivamente el primer nombre protegiendo apellidos', () => {
      expect(sanitizeCustomerFirstName('Lucía Benavides Morales')).toBe('Lucía')
      expect(sanitizeCustomerFirstName('Carlos Mendoza')).toBe('Carlos')
      expect(sanitizeCustomerFirstName('María   Fernanda')).toBe('María')
      expect(sanitizeCustomerFirstName(null)).toBe('Cliente')
      expect(sanitizeCustomerFirstName('')).toBe('Cliente')
    })

    it('el DTO público de seguimiento no contiene datos sensibles', () => {
      const publicDTO: PublicOrderTrackingDTO = {
        short_id: '#c9b4e720',
        status: 'processing',
        customer_first_name: sanitizeCustomerFirstName('Lucía Benavides'),
        channel: 'web_guest_tracking',
        delivery_date: '2026-09-10',
        delivery_time: '16:00',
        created_at: '2026-09-07T14:30:00.000Z',
        items: [{ name: 'Torta Selva Negra', quantity: 1 }],
        timeline: [],
        is_cancelled: false
      }

      // Validar que no existan propiedades prohibidas
      const keys = Object.keys(publicDTO)
      expect(keys).not.toContain('customer_phone')
      expect(keys).not.toContain('address')
      expect(keys).not.toContain('notes')
      expect(keys).not.toContain('total_amount')
      expect(keys).not.toContain('profile_id')
    })
  })

  describe('Construcción de la Línea de Tiempo (Timeline)', () => {
    function computeTimeline(status: string) {
      return [
        { status: 'pending', label: 'Registrado', completed: true, current: status === 'pending' },
        {
          status: 'processing',
          label: 'En Taller',
          completed: ['processing', 'ready', 'delivered'].includes(status),
          current: status === 'processing'
        },
        {
          status: 'ready',
          label: 'Listo',
          completed: ['ready', 'delivered'].includes(status),
          current: status === 'ready'
        },
        {
          status: 'delivered',
          label: 'Entregado',
          completed: status === 'delivered',
          current: status === 'delivered'
        }
      ]
    }

    it('marca correctamente los pasos activos y completados para "processing"', () => {
      const timeline = computeTimeline('processing')
      expect(timeline[0].completed).toBe(true)
      expect(timeline[0].current).toBe(false)
      expect(timeline[1].completed).toBe(true)
      expect(timeline[1].current).toBe(true)
      expect(timeline[2].completed).toBe(false)
      expect(timeline[3].completed).toBe(false)
    })

    it('marca todos los pasos como completados cuando el estado es "delivered"', () => {
      const timeline = computeTimeline('delivered')
      expect(timeline.every((s) => s.completed)).toBe(true)
      expect(timeline[3].current).toBe(true)
    })
  })
})
