import { describe, it, expect } from 'vitest'
import { validateImageBuffer } from '../../server/utils/image-validator'
import { CheckoutBodySchema } from '../../server/utils/schemas/checkout'
import type { PaymentStatus } from '../../app/types/payment'

describe('Payment Receipts & Verification Suite (Fase 6 / Subfase 6.4 / ADR-005)', () => {
  describe('validateImageBuffer (Magic Bytes Inspection & Size Limit)', () => {
    it('debe rechazar archivos que excedan los 2 MB permitidos', () => {
      const buffer = Buffer.alloc(100)
      const oversized = 2 * 1024 * 1024 + 1
      const result = validateImageBuffer(buffer, oversized)

      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('FILE_TOO_LARGE')
    })

    it('debe rechazar buffers corruptos o menores a 12 bytes', () => {
      const tinyBuffer = Buffer.from([0xFF, 0xD8])
      const result = validateImageBuffer(tinyBuffer, 2)

      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('FILE_CORRUPTED')
    })

    it('debe validar exitosamente un comprobante en formato JPEG mediante Magic Bytes (FF D8 FF)', () => {
      const jpegBuffer = Buffer.alloc(20)
      jpegBuffer[0] = 0xFF
      jpegBuffer[1] = 0xD8
      jpegBuffer[2] = 0xFF
      jpegBuffer[3] = 0xE0

      const result = validateImageBuffer(jpegBuffer, 20)
      expect(result.valid).toBe(true)
      expect(result.extension).toBe('jpg')
      expect(result.mimeType).toBe('image/jpeg')
    })

    it('debe validar exitosamente un comprobante en formato PNG mediante Magic Bytes', () => {
      const pngBuffer = Buffer.alloc(20)
      const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
      pngHeader.forEach((byte, idx) => {
        pngBuffer[idx] = byte
      })

      const result = validateImageBuffer(pngBuffer, 20)
      expect(result.valid).toBe(true)
      expect(result.extension).toBe('png')
      expect(result.mimeType).toBe('image/png')
    })

    it('debe validar exitosamente un comprobante en formato WebP (RIFF....WEBP)', () => {
      const webpBuffer = Buffer.alloc(20)
      // RIFF = 0x52, 0x49, 0x46, 0x46
      webpBuffer[0] = 0x52
      webpBuffer[1] = 0x49
      webpBuffer[2] = 0x46
      webpBuffer[3] = 0x46
      // WEBP = 0x57, 0x45, 0x42, 0x50
      webpBuffer[8] = 0x57
      webpBuffer[9] = 0x45
      webpBuffer[10] = 0x42
      webpBuffer[11] = 0x50

      const result = validateImageBuffer(webpBuffer, 20)
      expect(result.valid).toBe(true)
      expect(result.extension).toBe('webp')
      expect(result.mimeType).toBe('image/webp')
    })

    it('debe rechazar formatos no permitidos como PDFs disfrazados o ejecutables', () => {
      const fakePdfBuffer = Buffer.from('%PDF-1.4 header contents that is not an image')
      const result = validateImageBuffer(fakePdfBuffer, fakePdfBuffer.length)

      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('UNSUPPORTED_IMAGE_TYPE')
    })
  })

  describe('CheckoutBodySchema con Métodos de Pago', () => {
    it('debe asignar por defecto payment_method = "cash" si no se envía', () => {
      const input = {
        channel: 'direct',
        customer_name: 'María García',
        customer_phone: '987654321',
        address: 'Av. Larco 123, Miraflores',
        items: [{ product_id: 1, quantity: 2 }]
      }

      const parsed = CheckoutBodySchema.parse(input)
      expect(parsed.payment_method).toBe('cash')
    })

    it('debe aceptar payment_method = "yape" con payment_reference y payment_receipt_url', () => {
      const input = {
        channel: 'direct',
        customer_name: 'Carlos Ruiz',
        customer_phone: '987654321',
        address: 'Calle Las Begonias 456, San Isidro',
        payment_method: 'yape',
        payment_reference: 'OP-987654',
        payment_receipt_url: 'https://dulcefe.pe/storage/vouchers/voucher-1.jpg',
        items: [{ product_id: 1, quantity: 1 }]
      }

      const parsed = CheckoutBodySchema.parse(input)
      expect(parsed.payment_method).toBe('yape')
      expect(parsed.payment_reference).toBe('OP-987654')
      expect(parsed.payment_receipt_url).toBe('https://dulcefe.pe/storage/vouchers/voucher-1.jpg')
    })

    it('debe rechazar métodos de pago no soportados (ej. crypto)', () => {
      const input = {
        channel: 'direct',
        customer_name: 'Carlos Ruiz',
        customer_phone: '987654321',
        address: 'Calle Las Begonias 456',
        payment_method: 'crypto',
        items: [{ product_id: 1, quantity: 1 }]
      }

      const res = CheckoutBodySchema.safeParse(input)
      expect(res.success).toBe(false)
    })
  })

  describe('Lógica y Contratos de Verificación de Pago', () => {
    function computePaymentVerificationResult(
      action: 'verify' | 'reject',
      adminId: string
    ): {
      payment_status: PaymentStatus
      payment_verified_at: string | null
      payment_verified_by: string | null
      audit_action: string
    } {
      const isVerified = action === 'verify'
      return {
        payment_status: isVerified ? 'verified' : 'rejected',
        payment_verified_at: isVerified ? new Date().toISOString() : null,
        payment_verified_by: isVerified ? adminId : null,
        audit_action: isVerified ? 'payment.verified' : 'payment.rejected'
      }
    }

    it('debe transicionar a verified registrando auditoría y actor administrativo', () => {
      const adminId = 'admin-uuid-123'
      const result = computePaymentVerificationResult('verify', adminId)

      expect(result.payment_status).toBe('verified')
      expect(result.payment_verified_by).toBe(adminId)
      expect(result.payment_verified_at).toBeDefined()
      expect(result.audit_action).toBe('payment.verified')
    })

    it('debe transicionar a rejected sin fecha ni actor de verificación aprobada', () => {
      const adminId = 'admin-uuid-123'
      const result = computePaymentVerificationResult('reject', adminId)

      expect(result.payment_status).toBe('rejected')
      expect(result.payment_verified_by).toBeNull()
      expect(result.payment_verified_at).toBeNull()
      expect(result.audit_action).toBe('payment.rejected')
    })
  })
})
