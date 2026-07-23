<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
</script>

<template>
  <Transition name="drawer-root">
    <div v-if="cartStore.isDrawerOpen" class="fixed inset-0 z-[100] flex justify-end">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-[#2A321B]/40 backdrop-blur-sm drawer-backdrop"
        @click="cartStore.toggleDrawer()"
      ></div>

      <!-- Drawer -->
      <div class="relative w-full max-w-md bg-[#F4F1E1] h-full shadow-[-8px_0px_0px_#2A321B] border-l-4 border-[#2A321B] flex flex-col drawer-panel">
        
        <!-- Header -->
        <div class="p-6 border-b-4 border-[#2A321B] bg-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#4A5D23] rounded-full flex items-center justify-center text-white shadow-[2px_2px_0px_#2A321B] border-2 border-[#2A321B]">
              <Icon name="lucide:shopping-bag" class="w-5 h-5" />
            </div>
            <h2 class="text-2xl font-playfair font-black text-[#2A321B]">Tu Pedido</h2>
          </div>
          <button 
            @click="cartStore.toggleDrawer()"
            class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#2A321B] bg-white text-[#2A321B] hover:bg-[#991B1B] hover:text-white transition-colors shadow-[2px_2px_0px_#2A321B] active:translate-y-0.5 active:shadow-none"
          >
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto p-6">
          <TransitionGroup name="cart-item" tag="div" class="relative flex flex-col" appear>
            <div 
              v-if="cartStore.items.length === 0" 
              key="empty-cart"
              class="text-center py-12 mb-4"
            >
              <Icon name="lucide:shopping-cart" class="w-16 h-16 text-[#4A5D23]/30 mx-auto mb-4" />
              <p class="text-[#2A321B] font-bold font-playfair text-xl">Tu carrito está vacío</p>
              <p class="text-sm font-inter text-[#4A5D23] mt-2">¡Agrega algunas delicias para empezar!</p>
            </div>

            <div 
              v-for="(item, index) in cartStore.items" 
              :key="item.product_id"
              class="bg-white border-2 border-[#2A321B] rounded-2xl p-4 flex gap-4 shadow-[4px_4px_0px_#2A321B] w-full mb-4"
              :style="{ transitionDelay: `${index * 100}ms` }"
            >
          <div class="w-20 h-20 rounded-xl bg-[#F4F1E1] border-2 border-[#2A321B] overflow-hidden shrink-0">
            <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-[#4A5D23]">
              <Icon name="lucide:croissant" class="w-8 h-8" />
            </div>
          </div>
          
          <div class="flex-1 flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <h3 class="font-bold text-[#2A321B] leading-tight">{{ item.name }}</h3>
              <button 
                @click="cartStore.removeFromCart(item.product_id)"
                class="text-[#991B1B] hover:text-red-700 p-1"
              >
                <Icon name="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
            
            <div class="flex items-center justify-between mt-2">
              <span class="font-bold text-[#4A5D23]">S/ {{ Number(item.price).toFixed(2) }}</span>
              
              <div class="flex items-center gap-2 bg-[#F4F1E1] border-2 border-[#2A321B] rounded-lg p-1">
                <button 
                  @click="cartStore.updateQuantity(item.product_id, item.quantity - 1)"
                  class="w-6 h-6 flex items-center justify-center bg-white border border-[#2A321B] rounded text-[#2A321B] hover:bg-[#4A5D23] hover:text-white transition-colors"
                >
                  <Icon name="lucide:minus" class="w-3 h-3" />
                </button>
                <span class="w-6 text-center font-bold text-sm text-[#2A321B]">{{ item.quantity }}</span>
                <button 
                  @click="cartStore.updateQuantity(item.product_id, item.quantity + 1)"
                  class="w-6 h-6 flex items-center justify-center bg-white border border-[#2A321B] rounded text-[#2A321B] hover:bg-[#4A5D23] hover:text-white transition-colors"
                >
                  <Icon name="lucide:plus" class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-white border-t-4 border-[#2A321B]">
        <div class="flex justify-between items-center mb-4">
          <span class="font-bold text-[#4A5D23] uppercase tracking-widest text-sm">Subtotal</span>
          <span class="text-2xl font-black text-[#2A321B]">S/ {{ cartStore.cartTotal.toFixed(2) }}</span>
        </div>
        
        <button 
          @click="cartStore.toggleDrawer(); navigateTo('/checkout')"
          :disabled="cartStore.items.length === 0"
          class="w-full bg-[#4A5D23] text-white font-bold py-4 rounded-xl border-2 border-[#2A321B] shadow-[4px_4px_0px_#2A321B] hover:bg-[#3C4A1C] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Proceder al Pago
          <Icon name="lucide:arrow-right" class="w-5 h-5" />
        </button>
      </div>
      </div>
    </div>
  </Transition>
</template>
