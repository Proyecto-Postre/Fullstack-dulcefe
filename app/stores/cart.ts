import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, AddToCartInput } from '~/types/cart'

export type { CartItem, AddToCartInput }

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const isDrawerOpen = ref<boolean>(false)
  const isSyncing = ref<boolean>(false)

  const cartTotal = computed<number>(() => {
    return items.value.reduce((total, item) => total + (Number(item.price) * item.quantity), 0)
  })

  const cartItemCount = computed<number>(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0)
  })

  function toggleDrawer(): void {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  function openDrawer(): void {
    isDrawerOpen.value = true
  }

  function closeDrawer(): void {
    isDrawerOpen.value = false
  }

  function addToCart(product: AddToCartInput, quantity: number = 1): void {
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

  function removeFromCart(productId: string | number): void {
    const pId = String(productId)
    items.value = items.value.filter(item => String(item.product_id) !== pId)
  }

  function updateQuantity(productId: string | number, quantity: number): void {
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

  function clearCart(): void {
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
