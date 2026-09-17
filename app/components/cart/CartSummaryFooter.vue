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
  <div class="p-4 sm:p-6 bg-white border-t border-[#4A5D23]/10 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6">
    <div class="flex justify-between items-center mb-3 sm:mb-4">
      <div>
        <span class="font-bold text-[#4A5D23] uppercase tracking-widest text-[10px] sm:text-[11px] block">
          Total del Pedido
        </span>
        <span class="text-[11px] sm:text-xs text-[#4A5D23]/60 font-medium">Precios finales en Soles</span>
      </div>
      <div class="text-right">
        <span class="text-xl sm:text-2xl font-black font-inter text-[#2A321B]">
          S/ {{ total.toFixed(2) }}
        </span>
      </div>
    </div>
    
    <button 
      @click="$emit('checkout')"
      type="button"
      :disabled="isDisabled"
      class="w-full bg-[#4A5D23] text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-md hover:bg-[#3C4A1C] hover:shadow-lg active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base active:scale-[0.98]"
    >
      <span>Continuar con el Pedido</span>
      <Icon name="lucide:arrow-right" class="w-4 h-4 sm:w-5 sm:h-5" />
    </button>
  </div>
</template>
