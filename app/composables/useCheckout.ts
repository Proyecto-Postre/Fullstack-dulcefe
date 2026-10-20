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
   * Genera un UUID v4 compatible con RFC4122 que funciona en cualquier entorno,
   * incluyendo navegadores móviles (iOS/Android) sobre HTTP local (contextos no seguros)
   * donde crypto.randomUUID no está disponible.
   */
  const generateSafeUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID()
      } catch {
        // Fallback en caso de fallo
      }
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      try {
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
        bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
        return [...bytes].map((b, i) =>
          (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') +
          b.toString(16).padStart(2, '0')
        ).join('')
      } catch {
        // Fallback en caso de fallo
      }
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Obtiene o genera una llave de idempotencia persistente en la sesión del navegador
   * con protección contra excepciones en modo incógnito/privado.
   */
  const getOrCreateIdempotencyKey = (): string => {
    if (!import.meta.client) return generateSafeUUID()

    const storageKey = 'dulcefe_checkout_idempotency_key'
    try {
      let key = sessionStorage.getItem(storageKey)
      if (!key) {
        key = generateSafeUUID()
        sessionStorage.setItem(storageKey, key)
      }
      return key
    } catch {
      return generateSafeUUID()
    }
  }

  /**
   * Rota la llave de idempotencia una vez que el pedido se completó con éxito.
   */
  const clearIdempotencyKey = (): void => {
    if (import.meta.client) {
      try {
        sessionStorage.removeItem('dulcefe_checkout_idempotency_key')
      } catch {
        // Silencioso
      }
    }
  }

  /**
   * Envía la orden al servidor Nitro mediante POST /api/checkout.
   */
  const submitCheckout = async (payload: CheckoutBodyDTO): Promise<CheckoutResult | null> => {
    isSubmitting.value = true
    errorMessage.value = null
    errorDetails.value = []

    try {
      const idempotencyKey = getOrCreateIdempotencyKey()

      const response = await $fetch<CheckoutResult>('/api/checkout', {
        method: 'POST',
        retry: 0,
        timeout: 15000,
        headers: {
          'Idempotency-Key': idempotencyKey
        },
        body: payload
      })

      // Limpiar la clave al tener confirmación exitosa del servidor
      clearIdempotencyKey()
      return response
    } catch (err: unknown) {
      // Limpiar la clave local ante cualquier error para que el siguiente intento no quede bloqueado
      clearIdempotencyKey()

      const fetchError = err as {
        statusCode?: number
        data?: {
          error?: CheckoutApiError
        }
        message?: string
      }

      const apiError = fetchError.data?.error

      if (apiError) {
        errorMessage.value = apiError.message
        errorDetails.value = apiError.details || []
      } else {
        errorMessage.value = fetchError.message || 'Ocurrió un error inesperado al procesar tu pedido. Por favor intenta de nuevo.'
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
