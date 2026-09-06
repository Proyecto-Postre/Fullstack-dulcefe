import type { Database } from './database.types'

export type OrderRow = Database['public']['Tables']['orders']['Row']
export type OrderItemRow = Database['public']['Tables']['order_items']['Row']
export type ProductRow = Database['public']['Tables']['products']['Row']
export type AddressRow = Database['public']['Tables']['addresses']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface ProfileOrderItemProduct {
  name: string
  image_url: string | null
}

export interface ProfileOrderItem {
  id: string
  quantity: number
  price_at_time: number
  products: ProfileOrderItemProduct | null
}

export interface ProfileOrder {
  id: string
  created_at: string
  status: string | null
  total_amount: number
  delivery_date?: string | null
  delivery_time?: string | null
  notes?: string | null
  address?: string | null
  order_items?: ProfileOrderItem[]
}

export interface ProfileAddressItem {
  id: string
  profile_id?: string
  label: string
  address_line: string
  reference?: string
  is_default?: boolean
}

export type ProfileTab = 'history' | 'addresses' | 'points'
