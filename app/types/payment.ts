/**
/**
 * Tipos de Dominio para Métodos de Pago, Carga de Vouchers y Verificación (Fase 6 / ADR-005)
 */

export type PaymentMethod = 'cash' | 'yape' | 'plin' | 'card'
export type PaymentStatus = 'pending' | 'verified' | 'rejected'

export interface PaymentReceiptUploadResponse {
  success: boolean
  url: string
  fileName: string
}

export interface VerifyPaymentInput {
  action: 'verify' | 'reject'
  notes?: string
}

export interface VerifyPaymentResponse {
  success: boolean
  data: {
    order_id: string
    payment_status: PaymentStatus
    payment_verified_at: string | null
    payment_verified_by: string | null
  }
}
