<script setup lang="ts">
import { computed } from 'vue'
import type { CheckoutMode, DeliveryMode } from '~/types/checkout'

const props = withDefaults(
  defineProps<{
    modelValue?: CheckoutMode
    mode?: CheckoutMode
    deliveryMode?: DeliveryMode
  }>(),
  {
    modelValue: undefined,
    mode: undefined,
    deliveryMode: 'delivery'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: CheckoutMode): void
  (e: 'update:mode', value: CheckoutMode): void
  (e: 'update:deliveryMode', value: DeliveryMode): void
  (e: 'select', payload: { mode: CheckoutMode; deliveryMode: DeliveryMode }): void
}>()

const activeMode = computed<CheckoutMode>(() => props.mode ?? props.modelValue ?? 'direct')
const activeDeliveryMode = computed<DeliveryMode>(() => props.deliveryMode ?? 'delivery')

function selectMode(target: 'delivery' | 'meeting_point' | 'chat') {
  if (target === 'chat') {
    emit('update:modelValue', 'chat')
    emit('update:mode', 'chat')
    emit('select', { mode: 'chat', deliveryMode: activeDeliveryMode.value })
  } else {
    emit('update:modelValue', 'direct')
    emit('update:mode', 'direct')
    emit('update:deliveryMode', target)
    emit('select', { mode: 'direct', deliveryMode: target })
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#4A5D23]/10 shadow-soft-sm space-y-3 sm:space-y-4">
    <div class="flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-[#4A5D23]/10">
      <Icon name="lucide:truck" class="w-4 h-4 sm:w-5 sm:h-5 text-[#4A5D23]" />
      <h2 class="font-playfair font-bold text-base sm:text-lg text-[#2A321B]">Modalidad de Pedido</h2>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3" role="radiogroup" aria-label="Modalidad de pedido">
      <!-- Opción 1: Envío a Domicilio -->
      <button
        type="button"
        role="radio"
        :aria-checked="activeMode === 'direct' && activeDeliveryMode === 'delivery'"
        @click="selectMode('delivery')"
        :class="[
          'p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between gap-2 sm:gap-3',
          activeMode === 'direct' && activeDeliveryMode === 'delivery'
            ? 'border-[#4A5D23] bg-[#F4F1E1]/40 shadow-xs'
            : 'border-[#4A5D23]/15 hover:border-[#4A5D23]/40 bg-white'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#4A5D23]/10 flex items-center justify-center text-[#4A5D23]">
            <Icon name="lucide:truck" class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span
            v-if="activeMode === 'direct' && activeDeliveryMode === 'delivery'"
            class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#4A5D23] text-white flex items-center justify-center text-xs"
          >
            <Icon name="lucide:check" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </span>
        </div>
        <div>
          <h3 class="font-bold text-xs sm:text-sm text-[#2A321B]">Envío a Domicilio</h3>
          <p class="text-[11px] sm:text-xs text-[#4A5D23]/70 font-medium mt-0.5 leading-snug">
            A tu dirección y horario programado.
          </p>
        </div>
      </button>

      <!-- Opción 2: Punto de Encuentro -->
      <button
        type="button"
        role="radio"
        :aria-checked="activeMode === 'direct' && activeDeliveryMode === 'meeting_point'"
        @click="selectMode('meeting_point')"
        :class="[
          'p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between gap-2 sm:gap-3',
          activeMode === 'direct' && activeDeliveryMode === 'meeting_point'
            ? 'border-[#4A5D23] bg-[#F4F1E1]/40 shadow-xs'
            : 'border-[#4A5D23]/15 hover:border-[#4A5D23]/40 bg-white'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#4A5D23]/10 flex items-center justify-center text-[#4A5D23]">
            <Icon name="lucide:map-pin" class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Sin costo*
            </span>
            <span
              v-if="activeMode === 'direct' && activeDeliveryMode === 'meeting_point'"
              class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#4A5D23] text-white flex items-center justify-center text-xs"
            >
              <Icon name="lucide:check" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </span>
          </div>
        </div>
        <div>
          <h3 class="font-bold text-xs sm:text-sm text-[#2A321B]">Punto de Encuentro</h3>
          <p class="text-[11px] sm:text-xs text-[#4A5D23]/70 font-medium mt-0.5 leading-snug">
            Lugar pactado (fácil transporte).
          </p>
        </div>
      </button>

      <!-- Opción 3: Coordinar por WhatsApp -->
      <button
        type="button"
        role="radio"
        :aria-checked="activeMode === 'chat'"
        @click="selectMode('chat')"
        :class="[
          'p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between gap-2 sm:gap-3',
          activeMode === 'chat'
            ? 'border-[#4A5D23] bg-[#F4F1E1]/40 shadow-xs'
            : 'border-[#4A5D23]/15 hover:border-[#4A5D23]/40 bg-white'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 flex items-center justify-center text-green-700">
            <Icon name="lucide:message-circle" class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span
            v-if="activeMode === 'chat'"
            class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#4A5D23] text-white flex items-center justify-center text-xs"
          >
            <Icon name="lucide:check" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </span>
        </div>
        <div>
          <h3 class="font-bold text-xs sm:text-sm text-[#2A321B]">Por WhatsApp</h3>
          <p class="text-[11px] sm:text-xs text-[#4A5D23]/70 font-medium mt-0.5 leading-snug">
            Atención directa por chat.
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
