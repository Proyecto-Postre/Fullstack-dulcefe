/**
 * Tipos de Dominio: Seguimiento de Pedidos para Invitados (Fase 6 / ADR-002 / D2)
 */

export interface PublicTrackingItem {
  name: string
  quantity: number
}

export interface PublicTimelineStep {
  status: string
  label: string
  description: string
  completed: boolean
  current: boolean
}

export interface PublicOrderTrackingDTO {
  short_id: string
  status: string
  customer_first_name: string
  channel: string
  delivery_date: string | null
  delivery_time: string | null
  created_at: string
  items: PublicTrackingItem[]
  timeline: PublicTimelineStep[]
  is_cancelled: boolean
}
