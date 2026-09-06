import { describe, it, expect } from 'vitest'
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '../../app/utils/whatsapp'
import type { WhatsAppMessageParams } from '../../app/types/checkout'

describe('Fase 4: Dominio Checkout UI - Formateo de WhatsApp y Validación de Pedido', () => {
  describe('buildWhatsAppOrderMessage', () => {
    it('construye el mensaje en modo "direct" con dirección, fecha y desglose de productos', () => {
      const params: WhatsAppMessageParams = {
        orderId: 'c9b4e720-1234-4567-89ab-cdef01234567',
        customerName: 'Lucía Benavides',
        customerPhone: '987654321',
        mode: 'direct',
        address: 'Av. Larco 450, Miraflores',
        deliveryDate: '2026-09-10',
        deliveryTime: '16:00',
        notes: 'Empaque de regalo por favor',
        items: [
          { name: 'Torta Selva Negra', quantity: 1, price_at_time: '45.00' },
          { name: 'Box Alfajores (x12)', quantity: 2, price_at_time: '25.00' }
        ],
        totalAmount: '95.00'
      }

      const msg = buildWhatsAppOrderMessage(params)

      expect(msg).toContain('¡Hola Dulce Fe!')
      expect(msg).toContain('*#c9b4e720*') // Short ID (8 chars)
      expect(msg).toContain('*Cliente:* Lucía Benavides')
      expect(msg).toContain('*Teléfono:* 987654321')
      expect(msg).toContain('*Tipo de Entrega:* Envío a Domicilio')
      expect(msg).toContain('*Dirección:* Av. Larco 450, Miraflores')
      expect(msg).toContain('*Fecha:* 2026-09-10')
      expect(msg).toContain('*Hora:* 16:00')
      expect(msg).toContain('*Notas:* Empaque de regalo por favor')
      expect(msg).toContain('- 1x Torta Selva Negra (S/ 45.00)')
      expect(msg).toContain('- 2x Box Alfajores (x12) (S/ 25.00)')
      expect(msg).toContain('*Total a Pagar Oficial:* S/ 95.00')
    })

    it('construye el mensaje en modo "chat" indicando coordinación directa por chat', () => {
      const params: WhatsAppMessageParams = {
        orderId: 'e8d1a3b5-9999-8888-7777-666655554444',
        customerName: 'Carlos Mendoza',
        customerPhone: null,
        mode: 'chat',
        items: [
          { name: 'Cheesecake Frutos Rojos', quantity: 1, price_at_time: 38.0 }
        ],
        totalAmount: 38.0
      }

      const msg = buildWhatsAppOrderMessage(params)

      expect(msg).toContain('*#e8d1a3b5*')
      expect(msg).toContain('*Cliente:* Carlos Mendoza')
      expect(msg).not.toContain('*Teléfono:*')
      expect(msg).toContain('(Detalles de entrega a coordinar por chat)')
      expect(msg).not.toContain('*Dirección:*')
      expect(msg).toContain('- 1x Cheesecake Frutos Rojos (S/ 38.00)')
      expect(msg).toContain('*Total a Pagar Oficial:* S/ 38.00')
    })
  })

  describe('buildWhatsAppUrl', () => {
    it('limpia caracteres no numéricos del teléfono y codifica el mensaje', () => {
      const url = buildWhatsAppUrl('+51 998-265-700', '¡Hola Dulce Fe! Pedido #123')
      expect(url.startsWith('https://wa.me/51998265700?text=')).toBe(true)
      expect(url).toContain(encodeURIComponent('¡Hola Dulce Fe! Pedido #123'))
    })
  })

  describe('Lógica de Validación de Checkout', () => {
    function validateCheckout(mode: 'direct' | 'chat', name: string, address: string): boolean {
      if (mode === 'chat') {
        return name.trim() !== ''
      }
      return name.trim() !== '' && address.trim() !== ''
    }

    it('en modo directo exige tanto nombre como dirección', () => {
      expect(validateCheckout('direct', '', '')).toBe(false)
      expect(validateCheckout('direct', 'Lucía', '')).toBe(false)
      expect(validateCheckout('direct', '', 'Av. Larco 450')).toBe(false)
      expect(validateCheckout('direct', 'Lucía', 'Av. Larco 450')).toBe(true)
    })

    it('en modo chat solo exige el nombre del cliente', () => {
      expect(validateCheckout('chat', '', '')).toBe(false)
      expect(validateCheckout('chat', 'Carlos', '')).toBe(true)
      expect(validateCheckout('chat', '   ', '')).toBe(false)
    })
  })
})
