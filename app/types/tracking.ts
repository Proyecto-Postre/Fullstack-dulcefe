/**
 * Tipos de Dominio: Seguimiento de Pedidos para Invitados (Fase 6 / ADR-002 / D2)
 */

export interface PublicTrackingItem {
  name: string
  quantity: number
  price_at_time?: number
  image_url?: string | null
}

export interface PublicTimelineStep {
  status: string
  label: string
  description: string
  completed: boolean
  current: boolean
  icon?: string
}

export interface PublicOrderTrackingDTO {
  short_id: string
  status: string
  customer_first_name: string
  channel: string
  delivery_date: string | null
  delivery_time: string | null
  address?: string | null
  created_at: string
  total_amount?: number | null
  items: PublicTrackingItem[]
  timeline: PublicTimelineStep[]
  is_cancelled: boolean
  payment_method?: string | null
  payment_status?: string | null
  payment_reference?: string | null
  payment_receipt_url?: string | null
}
