<script setup lang="ts">
defineProps<{
  total: number
  isDisabled: boolean
}>()

defineEmits<{
  (e: 'checkout'): void
}>()
</script>

<template>
  <div class="p-6 bg-white border-t border-[#4A5D23]/10 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
    <div class="flex justify-between items-center mb-4">
      <div>
        <span class="font-bold text-[#4A5D23] uppercase tracking-widest text-[11px] block">
          Total del Pedido
        </span>
        <span class="text-xs text-[#4A5D23]/60 font-medium">Precios finales en Soles</span>
      </div>
      <div class="text-right">
        <span class="text-2xl font-black font-inter text-[#2A321B]">
          S/ {{ total.toFixed(2) }}
        </span>
      </div>
    </div>
    
    <button 
      @click="$emit('checkout')"
      type="button"
      :disabled="isDisabled"
      class="w-full bg-[#4A5D23] text-white font-bold py-4 rounded-xl shadow-md hover:bg-[#3C4A1C] hover:shadow-lg active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
    >
      <span>Continuar con el Pedido</span>
      <Icon name="lucide:arrow-right" class="w-5 h-5" />
    </button>
  </div>
</template>
