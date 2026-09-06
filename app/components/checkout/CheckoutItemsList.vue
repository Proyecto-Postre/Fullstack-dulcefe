<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import type { CartItem } from '~/types/cart'

const cartStore = useCartStore()

function updateQuantity(productId: string | number, qty: number): void {
  cartStore.updateQuantity(productId, qty)
}

function removeItem(productId: string | number): void {
  cartStore.removeFromCart(productId)
}
</script>

<template>
  <div class="bg-white rounded-3xl p-6 border border-[#4A5D23]/10 shadow-soft-sm space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-[#4A5D23]/10">
      <div class="flex items-center gap-2">
        <Icon name="lucide:shopping-bag" class="w-5 h-5 text-[#4A5D23]" />
        <h2 class="font-playfair font-bold text-lg text-[#2A321B]">Tus Postres</h2>
      </div>
      <span class="text-xs font-bold text-[#4A5D23] bg-[#F4F1E1] px-3 py-1 rounded-full border border-[#4A5D23]/15">
        {{ cartStore.cartItemCount }} {{ cartStore.cartItemCount === 1 ? 'ítem' : 'ítems' }}
      </span>
    </div>

    <!-- Lista con animación -->
    <div class="divide-y divide-[#4A5D23]/10">
      <div
        v-for="item in cartStore.items"
        :key="item.product_id"
        class="py-3 flex items-center justify-between gap-4 group"
      >
        <div class="flex items-center gap-3 min-w-0">
          <img
            :src="item.image_url || '/placeholder-cake.png'"
            :alt="item.name"
            class="w-12 h-12 rounded-xl object-cover bg-[#F4F1E1] border border-[#4A5D23]/10 shrink-0"
          />
          <div class="min-w-0">
            <h3 class="font-bold text-sm text-[#2A321B] truncate">{{ item.name }}</h3>
            <p class="text-xs text-[#4A5D23]/70 font-medium">S/ {{ Number(item.price).toFixed(2) }} c/u</p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <!-- Controles de cantidad (- / +) -->
          <div class="flex items-center border border-[#4A5D23]/20 rounded-xl overflow-hidden bg-[#F4F1E1]/40">
            <button
              type="button"
              @click="updateQuantity(item.product_id, item.quantity - 1)"
              class="w-7 h-7 flex items-center justify-center text-[#2A321B] hover:bg-[#4A5D23]/10 text-xs font-bold transition-colors cursor-pointer"
              title="Disminuir"
            >
              -
            </button>
            <span class="w-8 text-center text-xs font-black text-[#2A321B]">
              {{ item.quantity }}
            </span>
            <button
              type="button"
              @click="updateQuantity(item.product_id, item.quantity + 1)"
              class="w-7 h-7 flex items-center justify-center text-[#2A321B] hover:bg-[#4A5D23]/10 text-xs font-bold transition-colors cursor-pointer"
              title="Aumentar"
            >
              +
            </button>
          </div>

          <!-- Subtotal por ítem -->
          <span class="text-sm font-black text-[#2A321B] font-inter w-16 text-right">
            S/ {{ (Number(item.price) * item.quantity).toFixed(2) }}
          </span>

          <!-- Botón Eliminar -->
          <button
            type="button"
            @click="removeItem(item.product_id)"
            class="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Quitar producto"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
