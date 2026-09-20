import { EventEmitter } from 'node:events'

/**
 * Bus de eventos centralizado en memoria para Server-Sent Events (SSE).
 * Desacoplado de proveedores externos para soportar tiempo real sin vendor lock-in.
 */
export const orderEvents = new EventEmitter()
orderEvents.setMaxListeners(500)

export interface OrderUpdatePayload {
  order_id: string
  tracking_token?: string | null
  status: string
  timestamp: string
}

export function notifyOrderUpdated(payload: OrderUpdatePayload): void {
  if (payload.tracking_token) {
    orderEvents.emit(`order:token:${payload.tracking_token}`, payload)
  }
  if (payload.order_id) {
    orderEvents.emit(`order:id:${payload.order_id}`, payload)
  }
}
