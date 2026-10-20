export type CheckoutMode = 'direct' | 'chat'
export type DeliveryMode = 'delivery' | 'meeting_point'
export type DeliverySlot = 'morning' | 'night' | 'special'

export interface CheckoutFormData {
  name: string
  phone: string
  address: string
  deliveryMode: DeliveryMode
  meetingPointDetails?: string
  deliveryDate: string
  deliverySlot: DeliverySlot
  deliveryTime: string
  isCustomSchedule?: boolean
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
  delivery_mode?: DeliveryMode
  meeting_point_details?: string
  address?: string
  delivery_date?: string
  delivery_time?: string
  delivery_slot?: DeliverySlot
  is_custom_schedule?: boolean
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
  delivery_mode?: DeliveryMode | null
  meeting_point_details?: string | null
  address?: string | null
  delivery_date?: string | null
  delivery_time?: string | null
  delivery_slot?: DeliverySlot | null
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
  deliveryMode?: DeliveryMode
  meetingPointDetails?: string | null
  address?: string | null
  deliveryDate?: string | null
  deliveryTime?: string | null
  deliverySlot?: DeliverySlot | null
  isCustomSchedule?: boolean
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

