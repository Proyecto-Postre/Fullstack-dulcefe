import type { Database } from './database.types'

export type OrderRow = Database['public']['Tables']['orders']['Row']
export type OrderStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled'

export interface AdminOrderProfile {
  full_name: string | null
  phone: string | null
}

export interface AdminOrderItemProduct {
  name: string
}

export interface AdminOrderItem {
  id: number
  quantity: number
  price_at_time: number
  product_id: number
  products?: AdminOrderItemProduct | null
}

export interface AdminOrder {
  id: string
  profile_id: string | null
  status: OrderStatus
  total_price: number
  total_amount?: number
  delivery_date: string | null
  delivery_time: string | null
  notes: string | null
  address: string | null
  created_at: string
  channel?: string
  inventory_processed?: boolean
  points_awarded?: boolean
  customer_name?: string
  customer_phone?: string
  payment_method?: 'cash' | 'yape' | 'plin' | 'card' | null
  payment_reference?: string | null
  payment_receipt_url?: string | null
  payment_status?: 'pending' | 'verified' | 'rejected' | null
  payment_verified_at?: string | null
  payment_verified_by?: string | null
  profiles?: AdminOrderProfile | null
  order_items?: AdminOrderItem[]
}

export interface KanbanColumn {
  id: OrderStatus
  title: string
  color: string
  icon: string
  headerColor: string
}

export interface StatusUpdateResult {
  order_id: string
  from: string
  to: string
  inventory_processed: boolean
  points_awarded: boolean
}

export interface AdminOrderFormData {
  customerName: string
  customerPhone: string
  deliveryDate: string
  deliveryTime: string
  notes: string
}

export interface SelectedProductItem {
  product_id: number
  name: string
  price: number
  quantity: number
}

export interface AdminOrdersApiResponse {
  success: boolean
  data: AdminOrder[]
}
