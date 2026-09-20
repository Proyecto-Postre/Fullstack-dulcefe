import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateWebhookSignature, verifyWebhookSignature } from '../../server/utils/crypto'
import { WebhookService, type WebhookEventName } from '../../server/services/webhook.service'

describe('Webhook Dispatcher & n8n Integration Suite (Fase 6 / Subfase 6.6 / ADR-006 / D6)', () => {
  const SECRET = 'test_webhook_secret_key_12345'
  const SAMPLE_PAYLOAD = JSON.stringify({
    event: 'order.created',
    order_id: '00000000-0000-0000-0000-000000000001',
    customer_name: 'Ana María'
  })

  describe('Criptografía de Firma HMAC-SHA256 (X-DulceFe-Signature)', () => {
    it('debe generar una firma determinista de 64 caracteres en hexadecimal', () => {
      const signature = generateWebhookSignature(SAMPLE_PAYLOAD, SECRET)
      expect(signature).toBeDefined()
      expect(signature).toHaveLength(64)
      expect(/^[a-f0-9]{64}$/.test(signature)).toBe(true)

      // Verificación de determinismo
      const signature2 = generateWebhookSignature(SAMPLE_PAYLOAD, SECRET)
      expect(signature).toBe(signature2)
    })

    it('debe generar firmas completamente distintas si el payload o el secret varían', () => {
      const sig1 = generateWebhookSignature(SAMPLE_PAYLOAD, SECRET)
      const sig2 = generateWebhookSignature(SAMPLE_PAYLOAD + ' ', SECRET)
      const sig3 = generateWebhookSignature(SAMPLE_PAYLOAD, SECRET + '_different')

      expect(sig1).not.toBe(sig2)
      expect(sig1).not.toBe(sig3)
    })

    it('debe validar exitosamente con verifyWebhookSignature una firma legítima', () => {
      const signature = generateWebhookSignature(SAMPLE_PAYLOAD, SECRET)
      const isValid = verifyWebhookSignature(SAMPLE_PAYLOAD, SECRET, signature)
      expect(isValid).toBe(true)
    })

    it('debe rechazar firmas alteradas o falsificadas', () => {
      const signature = generateWebhookSignature(SAMPLE_PAYLOAD, SECRET)
      // Modificar el último carácter
      const tampered = signature.slice(0, -1) + (signature.endsWith('0') ? '1' : '0')
      const isValid = verifyWebhookSignature(SAMPLE_PAYLOAD, SECRET, tampered)
      expect(isValid).toBe(false)
    })

    it('debe retornar false si la firma recibida tiene longitud incorrecta sin arrojar excepción', () => {
      const isValid = verifyWebhookSignature(SAMPLE_PAYLOAD, SECRET, 'short_invalid_signature')
      expect(isValid).toBe(false)
    })
  })

  describe('WebhookService.dispatch & Tolerancia a Fallos', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
      vi.restoreAllMocks()
    })

    it('debe retornar false limpiamente si no hay N8N_WEBHOOK_URL configurado', async () => {
      delete process.env.N8N_WEBHOOK_URL
      delete process.env.WEBHOOK_DISPATCH_URL

      const res = await WebhookService.dispatch(
        'order.created',
        { order_id: 'test' },
        'req-test'
      )
      expect(res).toBe(false)
    })

    it('debe enviar cabeceras X-DulceFe canónicas y payload estructurado cuando hay URL configurada', async () => {
      process.env.N8N_WEBHOOK_URL = 'https://n8n.dulcefe.pe/webhook/test'
      process.env.N8N_WEBHOOK_SECRET = SECRET

      let capturedUrl = ''
      let capturedOptions: RequestInit | undefined

      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        capturedUrl = url.toString()
        capturedOptions = init
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      })
      vi.stubGlobal('fetch', mockFetch)

      const eventName: WebhookEventName = 'order.status_updated'
      const data = {
        order_id: 'ord-123',
        from_status: 'pending',
        to_status: 'processing'
      }

      const res = await WebhookService.dispatch(eventName, data, 'req-456')
      expect(res).toBe(true)
      expect(capturedUrl).toBe('https://n8n.dulcefe.pe/webhook/test')

      const headers = capturedOptions?.headers as Record<string, string>
      expect(headers['X-DulceFe-Event']).toBe('order.status_updated')
      expect(headers['X-DulceFe-Delivery']).toBeDefined()
      expect(headers['X-DulceFe-Timestamp']).toBeDefined()
      expect(headers['X-DulceFe-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/)

      const body = JSON.parse(capturedOptions?.body as string)
      expect(body.event).toBe('order.status_updated')
      expect(body.request_id).toBe('req-456')
      expect(body.data.order_id).toBe('ord-123')
    })

    it('nunca debe propagar errores si el endpoint de n8n falla o está caído', async () => {
      process.env.N8N_WEBHOOK_URL = 'https://n8n.dulcefe.pe/webhook/error'
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection timeout to n8n'))
      vi.stubGlobal('fetch', mockFetch)

      // No debe lanzar excepción
      const res = await WebhookService.dispatch(
        'payment.verified',
        { order_id: 'ord-error' },
        'req-err'
      )
      expect(res).toBe(false)
    })
  })
})
