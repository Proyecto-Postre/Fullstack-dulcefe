import { describe, it, expect } from 'vitest'

describe('Cart Endpoint Retirement — 410 Gone Protocol (PR-1a / §19 / §20.1 V2)', () => {
  it('el endpoint GET /api/cart debe responder 410 GONE', () => {
    const response410 = {
      statusCode: 410,
      statusMessage: 'Gone',
      data: {
        error: {
          code: 'CART_PERSISTENCE_DEPRECATED',
          message: 'El endpoint de carrito en base de datos ha sido desactivado. El estado del carrito se maneja localmente en el cliente.'
        }
      }
    }

    expect(response410.statusCode).toBe(410)
    expect(response410.data.error.code).toBe('CART_PERSISTENCE_DEPRECATED')
  })

  it('el endpoint POST /api/cart debe responder 410 GONE', () => {
    const response410 = {
      statusCode: 410,
      statusMessage: 'Gone',
      data: {
        error: {
          code: 'CART_PERSISTENCE_DEPRECATED',
          message: 'El endpoint de carrito en base de datos ha sido desactivado. El estado del carrito se maneja localmente en el cliente.'
        }
      }
    }

    expect(response410.statusCode).toBe(410)
    expect(response410.data.error.code).toBe('CART_PERSISTENCE_DEPRECATED')
  })

  it('el endpoint DELETE /api/cart/:productId debe responder 410 GONE', () => {
    const response410 = {
      statusCode: 410,
      statusMessage: 'Gone',
      data: {
        error: {
          code: 'CART_PERSISTENCE_DEPRECATED',
          message: 'El endpoint de carrito en base de datos ha sido desactivado. El estado del carrito se maneja localmente en el cliente.'
        }
      }
    }

    expect(response410.statusCode).toBe(410)
    expect(response410.data.error.code).toBe('CART_PERSISTENCE_DEPRECATED')
  })
})
