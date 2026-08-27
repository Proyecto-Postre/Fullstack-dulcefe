import { describe, it, expect } from 'vitest'
import cartGetHandler from '../../server/api/cart/index.get'
import cartPostHandler from '../../server/api/cart/index.post'
import cartDeleteHandler from '../../server/api/cart/[productId].delete'

describe('Cart Server API — 410 Gone Verification (PR-1a / PR-1d / §18)', () => {
  it('GET /api/cart debe responder 410 Gone con código CART_API_DISABLED', async () => {
    const mockEvent = { node: { res: { statusCode: 200 } } } as any
    const response = await (cartGetHandler as any)(mockEvent)
    expect(mockEvent.node.res.statusCode).toBe(410)
    expect(response.error.code).toBe('CART_API_DISABLED')
  })

  it('POST /api/cart debe responder 410 Gone con código CART_API_DISABLED', async () => {
    const mockEvent = { node: { res: { statusCode: 200 } } } as any
    const response = await (cartPostHandler as any)(mockEvent)
    expect(mockEvent.node.res.statusCode).toBe(410)
    expect(response.error.code).toBe('CART_API_DISABLED')
  })

  it('DELETE /api/cart/:productId debe responder 410 Gone con código CART_API_DISABLED', async () => {
    const mockEvent = { node: { res: { statusCode: 200 } } } as any
    const response = await (cartDeleteHandler as any)(mockEvent)
    expect(mockEvent.node.res.statusCode).toBe(410)
    expect(response.error.code).toBe('CART_API_DISABLED')
  })
})
