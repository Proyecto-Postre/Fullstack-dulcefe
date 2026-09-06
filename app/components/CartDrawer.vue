<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useConfetti } from '~/composables/useConfetti'
import { toast } from 'vue-sonner'
import { navigateTo } from 'nuxt/app'
import CartDrawerHeader from '~/components/cart/CartDrawerHeader.vue'
import CartEmptyState from '~/components/cart/CartEmptyState.vue'
import CartItemRow from '~/components/cart/CartItemRow.vue'
import CartSummaryFooter from '~/components/cart/CartSummaryFooter.vue'

const cartStore = useCartStore()
const { triggerConfetti } = useConfetti()

function handleRemoveItem(productId: string | number, name: string): void {
  cartStore.removeFromCart(productId)
  toast.info('Producto eliminado', {
    description: `${name} fue retirado de tu pedido.`
  })
}

function handleQuantityChange(productId: string | number, currentQty: number, delta: number): void {
  const newQty = currentQty + delta
  cartStore.updateQuantity(productId, newQty)
}

function handleProceedToCheckout(): void {
  triggerConfetti()
  cartStore.closeDrawer()
  navigateTo('/checkout')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div 
        v-if="cartStore.isDrawerOpen" 
        class="fixed inset-0 z-[9999] flex justify-end"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-[#2A321B]/50 backdrop-blur-sm transition-opacity"
          @click="cartStore.closeDrawer()"
        ></div>

        <!-- Drawer Panel -->
        <aside 
          class="relative w-full max-w-md bg-[#F4F1E1] h-full shadow-2xl border-l border-[#4A5D23]/20 flex flex-col z-10 animate-slide-in"
          @click.stop
        >
          <!-- Cabecera -->
          <CartDrawerHeader 
            :item-count="cartStore.cartItemCount" 
            @close="cartStore.closeDrawer()" 
          />

          <!-- Lista de Items o Estado Vacío -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <!-- Estado Vacío -->
            <CartEmptyState 
              v-if="cartStore.items.length === 0" 
              @close="cartStore.closeDrawer()" 
            />

            <!-- Lista de Productos con animación -->
            <div v-else v-auto-animate class="space-y-3.5">
              <CartItemRow
                v-for="item in cartStore.items"
                :key="item.product_id"
                :item="item"
                @remove="handleRemoveItem"
                @change-quantity="handleQuantityChange"
              />
            </div>
          </div>

          <!-- Pie de Resumen -->
          <CartSummaryFooter
            :total="cartStore.cartTotal"
            :is-disabled="cartStore.items.length === 0"
            @checkout="handleProceedToCheckout"
          />
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease-out;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.animate-slide-in {
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
