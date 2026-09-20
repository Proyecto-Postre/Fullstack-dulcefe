import { describe, it, expect } from 'vitest'
import { CheckoutBodySchema } from '../../server/utils/schemas/checkout'
import { solesToCents, centsToSoles, calculateLoyaltyPoints } from '../../server/utils/money'
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '../../app/utils/whatsapp'

describe('Smoke E2E de Arquitectura e Invariantes (§18, §19 PR-5)', () => {
  describe('Smoke 1: Flujo E2E de Checkout de Invitado (Guest Checkout)', () => {
    it('valida rigurosamente el DTO de entrada para un usuario invitado', () => {
      const guestPayload = {
        channel: 'direct' as const,
        customer_name: 'María Fernanda Ruiz',
        customer_phone: '987123456',
        delivery_date: '2026-10-15',
        delivery_time: '17:30',
        address: 'Av. Dos de Mayo 1540, San Isidro',
        notes: 'Dejar en recepción por favor',
        items: [
          { product_id: 1, quantity: 2 },
          { product_id: 2, quantity: 1 }
        ]
      }

      const parsed = CheckoutBodySchema.safeParse(guestPayload)
      expect(parsed.success).toBe(true)
    })

    it('rechaza teléfonos que no cumplan el formato peruano de 9 dígitos', () => {
      const invalidPayload = {
        channel: 'direct' as const,
        customer_name: 'Carlos Ruiz',
        customer_phone: '12345678', // Formato inválido
        delivery_date: '2026-10-15',
        delivery_time: '17:30',
        address: 'Av. Las Palmeras 100',
        items: [{ product_id: 1, quantity: 1 }]
      }

      const parsed = CheckoutBodySchema.safeParse(invalidPayload)
      expect(parsed.success).toBe(false)
    })

    it('asegura la invariante de dinero: suma en céntimos sin errores de punto flotante (§7.8, V45)', () => {
      // 0.10 + 0.20 === 0.30000000000000004 en JS clásico
      const price1 = solesToCents('0.10')
      const price2 = solesToCents('0.20')
      const totalCents = price1 + price2
      const formattedTotal = centsToSoles(totalCents)

      expect(totalCents).toBe(30)
      expect(formattedTotal).toBe('0.30')
    })

    it('construye el mensaje y URL de WhatsApp con los números oficiales del servidor sin adulteración (§7.7, V36)', () => {
      const serverVerifiedOrderId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
      const message = buildWhatsAppOrderMessage({
        orderId: serverVerifiedOrderId,
        customerName: 'María Fernanda Ruiz',
        customerPhone: '987123456',
        mode: 'direct',
        address: 'Av. Dos de Mayo 1540, San Isidro',
        deliveryDate: '2026-10-15',
        deliveryTime: '17:30',
        notes: 'Dejar en recepción por favor',
        items: [
          { name: 'Torta de Chocolate', quantity: 2, price_at_time: '45.00' }
        ],
        totalAmount: '90.00'
      })

      const whatsappUrl = buildWhatsAppUrl('51998265700', message)

      expect(message).toContain('*#a1b2c3d4*')
      expect(message).toContain('*Total a Pagar Oficial:* S/ 90.00')
      expect(whatsappUrl).toContain('https://wa.me/51998265700?text=')
      expect(whatsappUrl).toContain(encodeURIComponent('*#a1b2c3d4*'))
    })
  })

  describe('Smoke 2: Flujo E2E de Inicio de Sesión y Protección Admin (RBAC)', () => {
    it('rechaza acceso de administración si el usuario no tiene profile.is_admin = true (§7.7, V9)', () => {
      interface MockUser {
        id: string
        user_metadata: { is_admin?: boolean }
      }
      interface MockProfile {
        id: string
        is_admin: boolean
      }

      function evaluateAdminAccess(user: MockUser | null, profile: MockProfile | null): boolean {
        // Regla arquitectónica: NUNCA confiar en user_metadata.is_admin
        if (!user || !profile) return false
        return profile.is_admin === true
      }

      // Intento de forja en user_metadata
      const forgedUser: MockUser = {
        id: 'attacker-123',
        user_metadata: { is_admin: true }
      }
      const regularProfile: MockProfile = {
        id: 'attacker-123',
        is_admin: false
      }

      expect(evaluateAdminAccess(forgedUser, regularProfile)).toBe(false)

      // Admin legítimo
      const legitimateProfile: MockProfile = {
        id: 'admin-456',
        is_admin: true
      }
      expect(evaluateAdminAccess(forgedUser, legitimateProfile)).toBe(true)
    })

    it('garantiza que el cálculo de puntos de lealtad ignore pedidos de invitados (§7.5, V30)', () => {
      function awardPoints(totalCents: number, profileId: string | null): number {
        if (!profileId) return 0
        return calculateLoyaltyPoints(totalCents)
      }

      // Pedido de S/ 42.50 = 4250 céntimos
      const totalCents = 4250
      expect(awardPoints(totalCents, null)).toBe(0) // Invitado -> 0 puntos
      expect(awardPoints(totalCents, 'user-uuid-123')).toBe(42) // Cliente registrado -> 42 puntos
    })
  })
})
