<script setup lang="ts">
defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div class="text-center py-16 px-4 bg-white/90 rounded-[2rem] border border-dashed border-[#4A5D23]/30">
    <div class="w-16 h-16 rounded-full bg-[#F4F1E1] flex items-center justify-center mx-auto mb-4 text-[#4A5D23]">
      <Icon name="lucide:shopping-bag" class="w-8 h-8" />
    </div>
    <p class="text-[#2A321B] font-bold font-playfair text-xl mb-1">Tu carrito está vacío</p>
    <p class="text-xs font-inter text-[#4A5D23]/80 leading-relaxed max-w-[220px] mx-auto mb-6">
      ¡Agrega tus postres favoritos para comenzar a armar tu pedido!
    </p>
    <NuxtLink 
      to="/menu" 
      @click="$emit('close')"
      class="inline-flex items-center gap-2 px-6 py-3 bg-[#4A5D23] text-white rounded-full text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm active:translate-y-0.5"
    >
      Explorar Carta & Menú
      <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
    </NuxtLink>
  </div>
</template>
