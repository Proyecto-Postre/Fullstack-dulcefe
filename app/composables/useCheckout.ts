import { ref } from 'vue'
import type { CheckoutBodyDTO } from '~~/server/utils/schemas/checkout'
import type { CheckoutResult } from '~~/server/services/order.service'

export interface CheckoutErrorDetails {
  field?: string
  message: string
}

export interface CheckoutApiError {
  code: string
  message: string
  request_id?: string
  details?: CheckoutErrorDetails[]
}

export function useCheckout() {
  const isSubmitting = ref(false)
  const errorMessage = ref<string | null>(null)
  const errorDetails = ref<CheckoutErrorDetails[]>([])

  /**
   * Obtiene o genera una llave de idempotencia persistente en la sesión del navegador
   * para garantizar que reintentos por lentitud de red no dupliquen pedidos.
   */
  const getOrCreateIdempotencyKey = (): string => {
    if (!import.meta.client) return crypto.randomUUID()

    const storageKey = 'dulcefe_checkout_idempotency_key'
    let key = sessionStorage.getItem(storageKey)
    if (!key) {
      key = crypto.randomUUID()
      sessionStorage.setItem(storageKey, key)
    }
    return key
  }

  /**
   * Rota la llave de idempotencia una vez que el pedido se completó con éxito.
   */
  const clearIdempotencyKey = (): void => {
    if (import.meta.client) {
      sessionStorage.removeItem('dulcefe_checkout_idempotency_key')
    }
  }

  /**
   * Envía la orden al servidor Nitro mediante POST /api/checkout.
   */
  const submitCheckout = async (payload: CheckoutBodyDTO): Promise<CheckoutResult | null> => {
    isSubmitting.value = true
    errorMessage.value = null
    errorDetails.value = []

    const idempotencyKey = getOrCreateIdempotencyKey()

    try {
      const response = await $fetch<CheckoutResult>('/api/checkout', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey
        },
        body: payload
      })

      // Limpiar la clave al tener confirmación exitosa del servidor
      clearIdempotencyKey()
      return response
    } catch (err: unknown) {
      const fetchError = err as {
        statusCode?: number
        data?: {
          error?: CheckoutApiError
        }
      }

      const apiError = fetchError.data?.error

      if (apiError) {
        errorMessage.value = apiError.message
        errorDetails.value = apiError.details || []
      } else {
        errorMessage.value = 'Ocurrió un error inesperado al procesar tu pedido. Por favor intenta de nuevo.'
      }

      return null
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    errorMessage,
    errorDetails,
    submitCheckout
  }
}
