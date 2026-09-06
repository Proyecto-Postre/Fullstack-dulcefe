import { randomUUID } from 'node:crypto'
import { generateWebhookSignature } from '../utils/crypto'

export type WebhookEventName =
  | 'order.created'
  | 'order.status_updated'
  | 'order.cancelled'
  | 'payment.verified'
  | 'payment.rejected'

export interface WebhookEnvelope {
  event: WebhookEventName
  delivery_id: string
  timestamp: string
  request_id: string
  data: Record<string, unknown>
}

export class WebhookService {
  private static getWebhookUrl(): string | undefined {
    return process.env.N8N_WEBHOOK_URL || process.env.WEBHOOK_DISPATCH_URL
  }

  private static getWebhookSecret(): string {
    return process.env.N8N_WEBHOOK_SECRET || 'dulcefe_n8n_secret_default_key_2026'
  }

  /**
   * Despacha un evento de webhook de manera segura y asíncrona hacia n8n/Make (ADR-006 / D6).
   * Cero impacto en latencia de usuario: no bloquea ni lanza excepciones si n8n no responde.
   */
  static async dispatch(
    eventName: WebhookEventName,
    data: Record<string, unknown>,
    requestId: string
  ): Promise<boolean> {
    const webhookUrl = this.getWebhookUrl()
    if (!webhookUrl) {
      // Si no hay endpoint configurado (ej. dev local sin n8n), retorno rápido
      return false
    }

    const secret = this.getWebhookSecret()
    const deliveryId = randomUUID()
    const timestamp = new Date().toISOString()

    const envelope: WebhookEnvelope = {
      event: eventName,
      delivery_id: deliveryId,
      timestamp,
      request_id: requestId,
      data
    }

    const serializedPayload = JSON.stringify(envelope)
    const signature = generateWebhookSignature(serializedPayload, secret)

    try {
      // Petición con timeout corto para no retener recursos
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DulceFe-Webhook-Dispatcher/1.0',
          'X-DulceFe-Event': eventName,
          'X-DulceFe-Delivery': deliveryId,
          'X-DulceFe-Timestamp': timestamp,
          'X-DulceFe-Signature': `sha256=${signature}`
        },
        body: serializedPayload,
        signal: controller.signal
      })

      clearTimeout(timeout)
      return response.ok
    } catch (err: unknown) {
      // Fallo de webhook nunca interrumpe la operación principal
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.warn(`[WebhookService] Fallo al despachar ${eventName} a ${webhookUrl}: ${errorMsg}`)
      return false
    }
  }
}
