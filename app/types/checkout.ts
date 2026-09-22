export type CheckoutMode = 'direct' | 'chat'

export interface CheckoutFormData {
  name: string
  phone: string
  address: string
  deliveryDate: string
  deliveryTime: string
  notes: string
  paymentMethod?: 'cash' | 'yape' | 'plin' | 'card'
  paymentReference?: string
  paymentReceiptUrl?: string
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
  payment_method: 'cash' | 'yape' | 'plin' | 'card'
  payment_reference?: string
  payment_receipt_url?: string
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
  payment_method?: 'cash' | 'yape' | 'plin' | 'card' | null
  payment_reference?: string | null
  payment_receipt_url?: string | null
  payment_status?: string | null
  tracking_token?: string | null
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
  paymentMethod?: 'cash' | 'yape' | 'plin' | 'card' | string | null
  paymentReference?: string | null
  paymentReceiptUrl?: string | null
}
