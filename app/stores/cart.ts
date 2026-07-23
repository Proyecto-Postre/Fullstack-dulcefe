import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: string
  product_id: string
  name: string
  price: number
  image_url?: string
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const isDrawerOpen = ref(false)
  const isSyncing = ref(false)

  const cartTotal = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const cartItemCount = computed(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0)
  })

  function toggleDrawer() {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  function addToCart(product: any, quantity: number = 1) {
    const existingItem = items.value.find(item => item.product_id === product.id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        quantity: quantity
      })
    }
    // TODO: Sync with DB if logged in
    isDrawerOpen.value = true // Open drawer to show feedback
  }

  function removeFromCart(productId: string) {
    items.value = items.value.filter(item => item.product_id !== productId)
    // TODO: Sync with DB if logged in
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return
    const item = items.value.find(item => item.product_id === productId)
    if (item) {
      item.quantity = quantity
    }
    // TODO: Sync with DB if logged in
  }

  function clearCart() {
    items.value = []
  }

  return {
    items,
    isDrawerOpen,
    isSyncing,
    cartTotal,
    cartItemCount,
    toggleDrawer,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }
}, {
  persist: true
})
