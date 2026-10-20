import { describe, it, expect } from 'vitest'
import { CheckoutBodySchema, normalizeDeliveryTime } from '../../server/utils/schemas/checkout'
import { buildWhatsAppOrderMessage } from '../../app/utils/whatsapp'
import type { WhatsAppMessageParams } from '../../app/types/checkout'

describe('Modalidad de Entrega y Franjas Horarias en Checkout', () => {
  const baseOrder = {
    channel: 'direct',
    customer_name: 'Fiorella Ramos',
    customer_phone: '987654321',
    delivery_date: '2026-10-25',
    items: [{ product_id: 12, quantity: 1 }]
  }

  it('permite una orden con delivery a domicilio y direccion valida', () => {
    const order = {
      ...baseOrder,
      delivery_mode: 'delivery',
      address: 'Av. Dos de Mayo 550, San Isidro',
      delivery_slot: 'morning',
      delivery_time: '08:00 - 10:00'
    }
    const result = CheckoutBodySchema.safeParse(order)
    expect(result.success).toBe(true)
  })

  it('rechaza delivery a domicilio si no se proporciona direccion valida', () => {
    const order = {
      ...baseOrder,
      delivery_mode: 'delivery',
      address: '   ',
      delivery_slot: 'night'
    }
    const result = CheckoutBodySchema.safeParse(order)
    expect(result.success).toBe(false)
  })

  it('permite una orden con punto de encuentro acordado sin exigir direccion domiciliaria', () => {
    const order = {
      ...baseOrder,
      delivery_mode: 'meeting_point',
      meeting_point_details: 'Parroquia San Francisco de Borja, salida de misa 10am',
      delivery_slot: 'special',
      delivery_time: 'Por coordinar'
    }
    const result = CheckoutBodySchema.safeParse(order)
    expect(result.success).toBe(true)
  })

  it('rechaza punto de encuentro si no se detalla el lugar acordado ni address', () => {
    const order = {
      ...baseOrder,
      delivery_mode: 'meeting_point',
      meeting_point_details: '',
      address: ''
    }
    const result = CheckoutBodySchema.safeParse(order)
    expect(result.success).toBe(false)
  })

  it('normaliza correctamente franjas horarias y texto descriptivo', () => {
    expect(normalizeDeliveryTime('08:00 - 10:00')).toBe('08:00 - 10:00')
    expect(normalizeDeliveryTime('19:00 - 22:00')).toBe('19:00 - 22:00')
    expect(normalizeDeliveryTime('por coordinar')).toBe('Por coordinar')
    expect(normalizeDeliveryTime('3:30 pm')).toBe('15:30')
  })

  it('construye el mensaje de WhatsApp reflejando punto de encuentro y sin costo de delivery', () => {
    const params: WhatsAppMessageParams = {
      orderId: 'abc12345678',
      customerName: 'Lucia Ramirez',
      customerPhone: '987654321',
      mode: 'direct',
      deliveryMode: 'meeting_point',
      meetingPointDetails: 'Parroquia Nuestra Senora del Pilar',
      deliveryDate: '2026-10-26',
      deliveryTime: '08:00 - 10:00',
      items: [{ name: 'Cheesecake de Frutos Rojos', quantity: 1, price_at_time: 48.00 }],
      totalAmount: 48.00,
      paymentMethod: 'yape',
      paymentReference: '998877'
    }

    const message = buildWhatsAppOrderMessage(params)
    expect(message).toContain('Punto de Encuentro Acordado (Sin costo de delivery)')
    expect(message).toContain('Parroquia Nuestra Senora del Pilar')
    expect(message).toContain('08:00 - 10:00')
  })
})
