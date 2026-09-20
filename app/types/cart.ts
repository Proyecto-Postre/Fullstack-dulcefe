export interface CartItem {
  id: string
  product_id: string | number
  name: string
  price: number
  image_url?: string
  quantity: number
}

export interface AddToCartInput {
  id: string | number
  name: string
  price: number | string
  image_url?: string | null
}
