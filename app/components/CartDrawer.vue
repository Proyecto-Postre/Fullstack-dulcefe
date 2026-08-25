<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useConfetti } from '~/composables/useConfetti'
import { toast } from 'vue-sonner'

const cartStore = useCartStore()
const { triggerConfetti } = useConfetti()

function handleRemoveItem(productId: string | number, name: string) {
  cartStore.removeFromCart(productId)
  toast.info('Producto eliminado', {
    description: `${name} fue retirado de tu pedido.`,
    icon: '🗑️'
  })
}

function handleQuantityChange(productId: string | number, currentQty: number, delta: number) {
  const newQty = currentQty + delta
  cartStore.updateQuantity(productId, newQty)
}

function handleProceedToCheckout() {
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
          <!-- Header -->
          <div class="p-6 border-b border-[#4A5D23]/10 bg-white flex items-center justify-between shadow-xs">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-[#4A5D23] rounded-full flex items-center justify-center text-white shadow-sm border border-[#4A5D23]/20">
                <Icon name="lucide:shopping-bag" class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-2xl font-playfair font-black text-[#2A321B] leading-none">Tu Pedido</h2>
                <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mt-1">
                  {{ cartStore.cartItemCount }} {{ cartStore.cartItemCount === 1 ? 'producto' : 'productos' }}
                </p>
              </div>
            </div>

            <button 
              @click="cartStore.closeDrawer()"
              type="button"
              class="w-9 h-9 flex items-center justify-center rounded-full border border-[#4A5D23]/20 bg-[#F4F1E1] text-[#2A321B] hover:bg-[#991B1B] hover:text-white transition-all shadow-xs active:scale-95 cursor-pointer"
              aria-label="Cerrar carrito"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Cart Items List -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <!-- Empty State -->
            <div 
              v-if="cartStore.items.length === 0" 
              class="text-center py-16 px-4 bg-white/90 rounded-[2rem] border border-dashed border-[#4A5D23]/30"
            >
              <div class="w-16 h-16 rounded-full bg-[#F4F1E1] flex items-center justify-center mx-auto mb-4 text-[#4A5D23]">
                <Icon name="lucide:shopping-bag" class="w-8 h-8" />
              </div>
              <p class="text-[#2A321B] font-bold font-playfair text-xl mb-1">Tu carrito está vacío</p>
              <p class="text-xs font-inter text-[#4A5D23]/80 leading-relaxed max-w-[220px] mx-auto mb-6">
                ¡Agrega tus postres favoritos para comenzar a armar tu pedido!
              </p>
              <NuxtLink 
                to="/menu" 
                @click="cartStore.closeDrawer()"
                class="inline-flex items-center gap-2 px-6 py-3 bg-[#4A5D23] text-white rounded-full text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm active:translate-y-0.5"
              >
                Explorar Carta & Menú
                <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
              </NuxtLink>
            </div>

            <!-- Items list with AutoAnimate -->
            <div v-else v-auto-animate class="space-y-3.5">
              <div 
                v-for="item in cartStore.items" 
                :key="item.product_id"
                class="bg-white border border-[#4A5D23]/15 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-all duration-300 relative group"
              >
                <!-- Thumbnail -->
                <div class="w-20 h-20 rounded-xl bg-[#F4F1E1] border border-[#4A5D23]/15 overflow-hidden shrink-0">
                  <img 
                    v-if="item.image_url" 
                    :src="item.image_url" 
                    :alt="item.name" 
                    class="w-full h-full object-cover" 
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-[#4A5D23]">
                    <Icon name="lucide:cake-slice" class="w-7 h-7" />
                  </div>
                </div>
                
                <!-- Details -->
                <div class="flex-1 flex flex-col justify-between">
                  <div class="flex justify-between items-start gap-2">
                    <h3 class="font-bold text-sm text-[#2A321B] font-playfair leading-snug">{{ item.name }}</h3>
                    <button 
                      @click.stop="handleRemoveItem(item.product_id, item.name)"
                      type="button"
                      class="text-[#4A5D23]/40 hover:text-[#991B1B] p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                      title="Eliminar del pedido"
                    >
                      <Icon name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div class="flex items-center justify-between mt-2 pt-2 border-t border-[#4A5D23]/5">
                    <span class="font-bold font-inter text-[#4A5D23] text-sm">
                      S/ {{ (Number(item.price) * item.quantity).toFixed(2) }}
                    </span>
                    
                    <!-- Quantity controls -->
                    <div class="flex items-center gap-1 bg-[#F4F1E1] border border-[#4A5D23]/15 rounded-lg p-1">
                      <button 
                        @click.stop="handleQuantityChange(item.product_id, item.quantity, -1)"
                        type="button"
                        class="w-7 h-7 flex items-center justify-center bg-white border border-[#4A5D23]/20 rounded text-[#2A321B] hover:bg-[#4A5D23] hover:text-white transition-all shadow-xs active:scale-90 cursor-pointer"
                        aria-label="Disminuir cantidad"
                      >
                        <Icon name="lucide:minus" class="w-3.5 h-3.5" />
                      </button>
                      <span class="w-7 text-center font-bold text-xs text-[#2A321B] font-inter">{{ item.quantity }}</span>
                      <button 
                        @click.stop="handleQuantityChange(item.product_id, item.quantity, 1)"
                        type="button"
                        class="w-7 h-7 flex items-center justify-center bg-white border border-[#4A5D23]/20 rounded text-[#2A321B] hover:bg-[#4A5D23] hover:text-white transition-all shadow-xs active:scale-90 cursor-pointer"
                        aria-label="Aumentar cantidad"
                      >
                        <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-6 bg-white border-t border-[#4A5D23]/10 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
            <div class="flex justify-between items-center mb-4">
              <div>
                <span class="font-bold text-[#4A5D23] uppercase tracking-widest text-[11px] block">Total del Pedido</span>
                <span class="text-xs text-[#4A5D23]/60 font-medium">Precios finales en Soles</span>
              </div>
              <div class="text-right">
                <span class="text-2xl font-black font-inter text-[#2A321B]">S/ {{ cartStore.cartTotal.toFixed(2) }}</span>
              </div>
            </div>
            
            <button 
              @click="handleProceedToCheckout"
              type="button"
              :disabled="cartStore.items.length === 0"
              class="w-full bg-[#4A5D23] text-white font-bold py-4 rounded-xl shadow-md hover:bg-[#3C4A1C] hover:shadow-lg active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continuar con el Pedido</span>
              <Icon name="lucide:arrow-right" class="w-5 h-5" />
            </button>
          </div>

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
