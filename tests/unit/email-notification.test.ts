import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateOrderEmailHtml,
  EmailNotificationService,
  type OrderEmailNotificationData
} from '../../server/services/email-notification.service'

describe('Email Notification Service Suite — Dulce Fe', () => {
  const sampleData: OrderEmailNotificationData = {
    orderId: 'b4840e11-1234-5678-90ab-cdef12345678',
    trackingToken: 'tr_token_test_123',
    customerName: 'Jafeth Ynga',
    customerPhone: '998265700',
    deliveryMode: 'meeting_point',
    meetingPointDetails: 'Parroquia Nuestra Señora del Pilar',
    deliveryDate: '2026-10-25',
    deliveryTime: '08:00 - 10:00',
    paymentMethod: 'yape',
    paymentReference: 'OP-556677',
    totalAmount: '85.00',
    notes: 'Por favor incluir velita de cumpleaños',
    items: [
      { name: 'Cheesecake Frutos Rojos', quantity: 1, price_at_time: '45.00' },
      { name: 'Box Alfajores x12', quantity: 1, price_at_time: '40.00' }
    ]
  }

  describe('generateOrderEmailHtml', () => {
    it('genera el HTML con branding de Dulce Fe y datos clave del pedido', () => {
      const html = generateOrderEmailHtml(sampleData, 'https://dulcefe.pe')

      expect(html).toContain('Dulce Fe • Pastelería Fina')
      expect(html).toContain('B4840E11') // Short ID en mayúsculas
      expect(html).toContain('Jafeth Ynga')
      expect(html).toContain('998265700')
      expect(html).toContain('Cheesecake Frutos Rojos')
      expect(html).toContain('Box Alfajores x12')
      expect(html).toContain('S/ 85.00')
      expect(html).toContain('Por favor incluir velita de cumpleaños')
    })

    it('incluye badge de Punto de Encuentro cuando deliveryMode es meeting_point', () => {
      const html = generateOrderEmailHtml(sampleData, 'https://dulcefe.pe')

      expect(html).toContain('Punto de Encuentro (Sin costo)')
      expect(html).toContain('Parroquia Nuestra Señora del Pilar')
    })

    it('incluye badge de Delivery a Domicilio cuando deliveryMode es delivery', () => {
      const deliveryData: OrderEmailNotificationData = {
        ...sampleData,
        deliveryMode: 'delivery',
        address: 'Av. Larco 450, Dpto 302, Miraflores',
        meetingPointDetails: null
      }
      const html = generateOrderEmailHtml(deliveryData, 'https://dulcefe.pe')

      expect(html).toContain('Delivery a Domicilio')
      expect(html).toContain('Av. Larco 450, Dpto 302, Miraflores')
    })

    it('genera el enlace directo para chatear con el cliente por WhatsApp', () => {
      const html = generateOrderEmailHtml(sampleData, 'https://dulcefe.pe')

      expect(html).toContain('https://wa.me/51998265700')
      expect(html).toContain('Abrir WhatsApp con el Cliente')
    })

    it('incluye los enlaces al panel administrativo y al tracking del cliente', () => {
      const html = generateOrderEmailHtml(sampleData, 'https://dulcefe.pe')

      expect(html).toContain('https://dulcefe.pe/admin/pedidos')
      expect(html).toContain('https://dulcefe.pe/pedido/tr_token_test_123')
    })
  })

  describe('EmailNotificationService.sendNewOrderNotification', () => {
    const originalEnv = process.env

    beforeEach(() => {
      vi.resetModules()
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
      vi.restoreAllMocks()
    })

    it('simula con éxito y retorna false si no hay RESEND_API_KEY configurada', async () => {
      delete process.env.RESEND_API_KEY
      const result = await EmailNotificationService.sendNewOrderNotification(sampleData)
      expect(result).toBe(false)
    })

    it('envía petición POST a Resend cuando RESEND_API_KEY está configurada', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123'
      process.env.ADMIN_NOTIFICATION_EMAIL = 'jafethworren@gmail.com'

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'email_123' })
      })
      vi.stubGlobal('fetch', fetchMock)

      const result = await EmailNotificationService.sendNewOrderNotification(sampleData)

      expect(result).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const callArgs = fetchMock.mock.calls[0]
      expect(callArgs[0]).toBe('https://api.resend.com/emails')
      expect(callArgs[1].headers.Authorization).toBe('Bearer re_test_key_123')

      const body = JSON.parse(callArgs[1].body)
      expect(body.to).toEqual(['jafethworren@gmail.com'])
      expect(body.subject).toContain('Nuevo Pedido #B4840E11')
    })

    it('captura errores de red y retorna false sin lanzar excepción', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123'

      const fetchMock = vi.fn().mockRejectedValue(new Error('Network connection timeout'))
      vi.stubGlobal('fetch', fetchMock)

      const result = await EmailNotificationService.sendNewOrderNotification(sampleData)
      expect(result).toBe(false)
    })
  })
})
