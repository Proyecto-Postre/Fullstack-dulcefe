export type CheckoutMode = 'direct' | 'chat'

export interface CheckoutFormData {
  name: string
  phone: string
  address: string
  deliveryDate: string
  deliveryTime: string
  notes: string
}

export interface CheckoutItemPayload {
  product_id: number
  quantity: number
}

export interface CheckoutPayload {
  channel: 'direct' | 'whatsapp_chat'
  customer_name: string
  customer_phone?: string
  address?: string
  delivery_date?: string
  delivery_time?: string
  notes?: string
  items: CheckoutItemPayload[]
}

export interface CheckoutServerOrderItem {
  id: number
  product_id: number
  name: string
  price_at_time: string | number
  quantity: number
}

export interface CheckoutServerOrder {
  id: string
  customer_name: string
  customer_phone?: string | null
  address?: string | null
  delivery_date?: string | null
  delivery_time?: string | null
  notes?: string | null
  total_amount: string | number
  items: CheckoutServerOrderItem[]
}

export interface WhatsAppMessageParams {
  orderId: string
  customerName: string
  customerPhone?: string | null
  mode: CheckoutMode
  address?: string | null
  deliveryDate?: string | null
  deliveryTime?: string | null
  notes?: string | null
  items: Array<{
    name: string
    quantity: number
    price_at_time: string | number
  }>
  totalAmount: string | number
}
