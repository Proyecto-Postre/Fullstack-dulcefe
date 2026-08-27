import { defineEventHandler, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  setResponseStatus(event, 410)
  return {
    error: {
      code: 'CART_API_DISABLED',
      message: 'Cart API is disabled. Cart state is managed on client via Pinia and cookies.'
    }
  }
})
