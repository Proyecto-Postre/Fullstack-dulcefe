<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()

function updateQuantity(productId: string | number, qty: number): void {
  cartStore.updateQuantity(productId, qty)
}

function removeItem(productId: string | number): void {
  cartStore.removeFromCart(productId)
}
</script>

<template>
  <div class="bg-white rounded-3xl p-5 sm:p-6 border border-[#4A5D23]/10 shadow-soft-sm space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-[#4A5D23]/10">
      <div class="flex items-center gap-2">
        <Icon name="lucide:shopping-bag" class="w-5 h-5 text-[#4A5D23]" />
        <h2 class="font-playfair font-bold text-lg text-[#2A321B]">Tus Postres</h2>
      </div>
      <span class="text-xs font-bold text-[#4A5D23] bg-[#F4F1E1] px-3 py-1 rounded-full border border-[#4A5D23]/15">
        {{ cartStore.cartItemCount }} {{ cartStore.cartItemCount === 1 ? 'ítem' : 'ítems' }}
      </span>
    </div>

    <!-- Lista de Productos -->
    <div class="divide-y divide-[#4A5D23]/10">
      <div
        v-for="item in cartStore.items"
        :key="item.product_id"
        class="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
      >
        <!-- Info del producto: Imagen + Nombre completo + Precio unitario + Botón eliminar en mobile -->
        <div class="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <img
            :src="item.image_url || '/placeholder-cake.png'"
            :alt="item.name"
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-[#F4F1E1] border border-[#4A5D23]/10 shrink-0 shadow-xs"
          />
          <div class="min-w-0 flex-1 pr-1">
            <h3 class="font-bold text-sm sm:text-base text-[#2A321B] leading-snug line-clamp-2">
              {{ item.name }}
            </h3>
            <p class="text-xs text-[#4A5D23]/75 font-semibold mt-1">
              S/ {{ Number(item.price).toFixed(2) }} <span class="text-[11px] font-normal text-[#4A5D23]/60">c/u</span>
            </p>
          </div>

          <!-- Botón Eliminar en Mobile (Ubicado en la esquina superior derecha) -->
          <button
            type="button"
            @click="removeItem(item.product_id)"
            class="sm:hidden w-8 h-8 rounded-xl text-red-500/80 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer -mr-1"
            aria-label="Quitar producto"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>

        <!-- Acciones: Selector de cantidad + Subtotal + Botón Eliminar en Desktop -->
        <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t border-[#4A5D23]/5 sm:border-0 pl-17 sm:pl-0">
          <!-- Controles de cantidad (- / +) -->
          <div class="flex items-center border border-[#4A5D23]/20 rounded-xl overflow-hidden bg-[#F4F1E1]/40 shadow-2xs">
            <button
              type="button"
              @click="updateQuantity(item.product_id, item.quantity - 1)"
              class="w-8 h-8 flex items-center justify-center text-[#2A321B] hover:bg-[#4A5D23]/10 text-sm font-bold transition-colors cursor-pointer active:scale-90"
              aria-label="Disminuir cantidad"
            >
              -
            </button>
            <span class="w-9 text-center text-xs font-black text-[#2A321B]">
              {{ item.quantity }}
            </span>
            <button
              type="button"
              @click="updateQuantity(item.product_id, item.quantity + 1)"
              class="w-8 h-8 flex items-center justify-center text-[#2A321B] hover:bg-[#4A5D23]/10 text-sm font-bold transition-colors cursor-pointer active:scale-90"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          <!-- Subtotal por ítem -->
          <div class="text-right sm:w-24">
            <span class="text-[10px] text-[#4A5D23]/60 block sm:hidden font-medium">Subtotal</span>
            <span class="text-base font-black text-[#2A321B] font-inter">
              S/ {{ (Number(item.price) * item.quantity).toFixed(2) }}
            </span>
          </div>

          <!-- Botón Eliminar en Desktop -->
          <button
            type="button"
            @click="removeItem(item.product_id)"
            class="hidden sm:flex w-8 h-8 rounded-xl text-red-500/80 hover:text-red-600 hover:bg-red-50 items-center justify-center transition-colors cursor-pointer"
            aria-label="Quitar producto"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
