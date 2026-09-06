<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import type { CheckoutMode } from '~/types/checkout'

const props = defineProps<{
  mode: CheckoutMode
  isValid: boolean
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const cartStore = useCartStore()
</script>

<template>
  <div class="bg-white rounded-3xl p-6 border border-[#4A5D23]/10 shadow-soft-sm space-y-5 sticky top-24">
    <div class="flex items-center gap-2 pb-3 border-b border-[#4A5D23]/10">
      <Icon name="lucide:receipt" class="w-5 h-5 text-[#4A5D23]" />
      <h2 class="font-playfair font-bold text-lg text-[#2A321B]">Resumen de Compra</h2>
    </div>

    <div class="space-y-3 text-sm">
      <div class="flex justify-between items-center text-[#4A5D23]/80">
        <span>Subtotal Productos</span>
        <span class="font-bold text-[#2A321B]">S/ {{ cartStore.cartTotal.toFixed(2) }}</span>
      </div>

      <div class="flex justify-between items-center text-[#4A5D23]/80">
        <span>Costo de Envío</span>
        <span class="text-xs font-bold text-[#4A5D23] bg-[#F4F1E1] px-2 py-0.5 rounded-md">
          {{ mode === 'direct' ? 'A coordinar' : 'Gratis en tienda' }}
        </span>
      </div>

      <div class="pt-3 border-t border-[#4A5D23]/10 flex justify-between items-baseline">
        <span class="font-bold text-base text-[#2A321B]">Total Estimado</span>
        <div class="text-right">
          <span class="text-2xl font-black text-[#2A321B] font-inter">
            S/ {{ cartStore.cartTotal.toFixed(2) }}
          </span>
          <p class="text-[10px] text-[#4A5D23]/60 font-medium">Importe final verificado en servidor</p>
        </div>
      </div>
    </div>

    <!-- Botón de Envío -->
    <button
      type="button"
      @click="emit('submit')"
      :disabled="!isValid || isSubmitting"
      class="w-full py-3.5 px-6 rounded-2xl bg-[#4A5D23] text-white font-bold text-sm hover:bg-[#3C4A1C] transition-all shadow-md active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
    >
      <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-5 h-5 animate-spin" />
      <Icon v-else name="lucide:message-circle" class="w-5 h-5" />
      <span>{{ isSubmitting ? 'Procesando Pedido...' : 'Confirmar y Enviar por WhatsApp' }}</span>
    </button>

    <div class="flex items-start gap-2 bg-[#F4F1E1]/40 p-3 rounded-xl border border-[#4A5D23]/10 text-xs text-[#4A5D23]/80">
      <Icon name="lucide:shield-check" class="w-4 h-4 text-[#4A5D23] shrink-0 mt-0.5" />
      <p class="text-[11px] leading-relaxed">
        Tu pedido se registrará con clave de idempotencia única para garantizar que no haya duplicaciones.
      </p>
    </div>
  </div>
</template>
