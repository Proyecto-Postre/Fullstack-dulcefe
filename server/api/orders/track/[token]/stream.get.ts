import { defineEventHandler, getRouterParam, createError, createEventStream } from 'h3'
import { isValidTrackingTokenFormat } from '../../../../utils/crypto'
import { orderEvents, type OrderUpdatePayload } from '../../../../utils/order-events'

/**
 * Endpoint de Server-Sent Events (SSE) para el seguimiento de pedidos en vivo.
 * Reemplaza el polling periódico agresivo por transmisión de eventos en tiempo real.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  // 1. Validar formato estricto del token HMAC-SHA256 (64 hex lowercase)
  if (!token || !isValidTrackingTokenFormat(token)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'INVALID_TRACKING_TOKEN',
      data: {
        error: {
          code: 'INVALID_TRACKING_TOKEN',
          message: 'El token de seguimiento proporcionado tiene un formato inválido.'
        }
      }
    })
  }

  const eventStream = createEventStream(event)

  // 2. Enviar evento de conexión inicial exitosa
  await eventStream.push(JSON.stringify({
    type: 'connected',
    token: token.slice(0, 8),
    timestamp: new Date().toISOString()
  }))

  // 3. Suscribirse a los eventos del bus en memoria para esta orden específica
  const eventKey = `order:token:${token}`

  const onOrderUpdate = async (payload: OrderUpdatePayload) => {
    try {
      await eventStream.push(JSON.stringify({
        type: 'order_updated',
        status: payload.status,
        timestamp: payload.timestamp
      }))
    } catch {
      // Ignorar si el cliente ya cerró la conexión
    }
  }

  orderEvents.on(eventKey, onOrderUpdate)

  // 4. Heartbeat periódico para prevenir cierres por timeout en proxies HTTP/Nginx/móviles
  const heartbeatTimer = setInterval(async () => {
    try {
      await eventStream.push(JSON.stringify({ type: 'ping' }))
    } catch {
      clearInterval(heartbeatTimer)
    }
  }, 25000)

  // 5. Limpieza garantizada cuando el cliente se desconecta
  eventStream.onClosed(() => {
    clearInterval(heartbeatTimer)
    orderEvents.off(eventKey, onOrderUpdate)
  })

  return eventStream.send()
})
