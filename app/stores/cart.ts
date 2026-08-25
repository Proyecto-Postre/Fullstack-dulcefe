import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: string
  product_id: string | number
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
    return items.value.reduce((total, item) => total + (Number(item.price) * item.quantity), 0)
  })

  const cartItemCount = computed(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0)
  })

  function toggleDrawer() {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  function openDrawer() {
    isDrawerOpen.value = true
  }

  function closeDrawer() {
    isDrawerOpen.value = false
  }

  function addToCart(product: any, quantity: number = 1) {
    if (!product) return
    const pId = String(product.id)
    const existingItem = items.value.find(item => String(item.product_id) === pId)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Date.now() + Math.random())

      items.value.push({
        id: generatedId,
        product_id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image_url: product.image_url || '',
        quantity: Math.max(1, quantity)
      })
    }
    isDrawerOpen.value = true
  }

  function removeFromCart(productId: string | number) {
    const pId = String(productId)
    items.value = items.value.filter(item => String(item.product_id) !== pId)
  }

  function updateQuantity(productId: string | number, quantity: number) {
    const pId = String(productId)
    if (quantity <= 0) {
      removeFromCart(pId)
      return
    }
    const item = items.value.find(item => String(item.product_id) === pId)
    if (item) {
      item.quantity = quantity
    }
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
    openDrawer,
    closeDrawer,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }
}, {
  persist: true
})
