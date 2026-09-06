<script setup lang="ts">
import type { CartItem } from '~/types/cart'

defineProps<{
  item: CartItem
}>()

defineEmits<{
  (e: 'remove', productId: string | number, name: string): void
  (e: 'changeQuantity', productId: string | number, currentQty: number, delta: number): void
}>()
</script>

<template>
  <div 
    class="bg-white border border-[#4A5D23]/15 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-all duration-300 relative group"
  >
    <!-- Miniatura de Imagen -->
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
    
    <!-- Información y Controles -->
    <div class="flex-1 flex flex-col justify-between">
      <div class="flex justify-between items-start gap-2">
        <h3 class="font-bold text-sm text-[#2A321B] font-playfair leading-snug">
          {{ item.name }}
        </h3>
        <button 
          @click.stop="$emit('remove', item.product_id, item.name)"
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
        
        <!-- Controles de Cantidad -->
        <div class="flex items-center gap-1 bg-[#F4F1E1] border border-[#4A5D23]/15 rounded-lg p-1">
          <button 
            @click.stop="$emit('changeQuantity', item.product_id, item.quantity, -1)"
            type="button"
            class="w-7 h-7 flex items-center justify-center bg-white border border-[#4A5D23]/20 rounded text-[#2A321B] hover:bg-[#4A5D23] hover:text-white transition-all shadow-xs active:scale-90 cursor-pointer"
            aria-label="Disminuir cantidad"
          >
            <Icon name="lucide:minus" class="w-3.5 h-3.5" />
          </button>
          <span class="w-7 text-center font-bold text-xs text-[#2A321B] font-inter">
            {{ item.quantity }}
          </span>
          <button 
            @click.stop="$emit('changeQuantity', item.product_id, item.quantity, 1)"
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
</template>
