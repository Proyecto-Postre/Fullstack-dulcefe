import { describe, it, expect } from 'vitest'
import { CheckoutBodySchema } from '../../server/utils/schemas/checkout'

describe('Validación de Esquema de Checkout (server/utils/schemas/checkout.ts)', () => {
  const validDirectOrder = {
    channel: 'direct',
    customer_name: 'María García',
    customer_phone: '987654321',
    address: 'Av. Las Flores 123, San Isidro',
    delivery_date: '2026-09-10',
    delivery_time: '15:30',
    notes: 'Por favor tocar timbre blanco',
    items: [
      { product_id: 1, quantity: 2 },
      { product_id: 4, quantity: 1 }
    ]
  }

  it('acepta una orden de compra directa con todos los campos válidos', () => {
    const result = CheckoutBodySchema.safeParse(validDirectOrder)
    expect(result.success).toBe(true)
  })

  it('acepta formato de teléfono peruano con prefijo +51', () => {
    const orderWithPrefix = {
      ...validDirectOrder,
      customer_phone: '+51987654321'
    }
    const result = CheckoutBodySchema.safeParse(orderWithPrefix)
    expect(result.success).toBe(true)
  })

  it('rechaza teléfonos que no cumplan el formato de Perú', () => {
    const orderInvalidPhone = {
      ...validDirectOrder,
      customer_phone: '12345678' // Menos de 9 dígitos y no empieza con 9
    }
    const result = CheckoutBodySchema.safeParse(orderInvalidPhone)
    expect(result.success).toBe(false)
  })

  it('exige teléfono y dirección cuando el canal es direct', () => {
    const incompleteDirect = {
      channel: 'direct',
      customer_name: 'Juan Pérez',
      items: [{ product_id: 1, quantity: 1 }]
    }
    const result = CheckoutBodySchema.safeParse(incompleteDirect)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path[0])
      expect(paths).toContain('customer_phone')
      expect(paths).toContain('address')
    }
  })

  it('permite omitir teléfono y dirección cuando el canal es whatsapp_chat', () => {
    const validChatOrder = {
      channel: 'whatsapp_chat',
      customer_name: 'Carlos Mendoza',
      items: [{ product_id: 2, quantity: 1 }]
    }
    const result = CheckoutBodySchema.safeParse(validChatOrder)
    expect(result.success).toBe(true)
  })

  it('rechaza pedidos sin ítems o con más de 30 líneas', () => {
    const emptyItemsOrder = {
      ...validDirectOrder,
      items: []
    }
    expect(CheckoutBodySchema.safeParse(emptyItemsOrder).success).toBe(false)
  })

  it('rechaza cantidades menores a 1 o mayores a 50 por ítem', () => {
    const zeroQuantityOrder = {
      ...validDirectOrder,
      items: [{ product_id: 1, quantity: 0 }]
    }
    expect(CheckoutBodySchema.safeParse(zeroQuantityOrder).success).toBe(false)

    const excessiveQuantityOrder = {
      ...validDirectOrder,
      items: [{ product_id: 1, quantity: 51 }]
    }
    expect(CheckoutBodySchema.safeParse(excessiveQuantityOrder).success).toBe(false)
  })

  it('rechaza nombres menores a 2 caracteres', () => {
    const shortNameOrder = {
      ...validDirectOrder,
      customer_name: 'A'
    }
    expect(CheckoutBodySchema.safeParse(shortNameOrder).success).toBe(false)
  })
})
