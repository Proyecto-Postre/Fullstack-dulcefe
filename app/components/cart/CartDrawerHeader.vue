<script setup lang="ts">
defineProps<{
  itemCount: number
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div class="p-6 border-b border-[#4A5D23]/10 bg-white flex items-center justify-between shadow-xs">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-[#4A5D23] rounded-full flex items-center justify-center text-white shadow-sm border border-[#4A5D23]/20">
        <Icon name="lucide:shopping-bag" class="w-5 h-5" />
      </div>
      <div>
        <h2 class="text-2xl font-playfair font-black text-[#2A321B] leading-none">Tu Pedido</h2>
        <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mt-1">
          {{ itemCount }} {{ itemCount === 1 ? 'producto' : 'productos' }}
        </p>
      </div>
    </div>

    <button 
      @click="$emit('close')"
      type="button"
      class="w-9 h-9 flex items-center justify-center rounded-full border border-[#4A5D23]/20 bg-[#F4F1E1] text-[#2A321B] hover:bg-[#991B1B] hover:text-white transition-all shadow-xs active:scale-95 cursor-pointer"
      aria-label="Cerrar carrito"
    >
      <Icon name="lucide:x" class="w-4 h-4" />
    </button>
  </div>
</template>
