<script setup lang="ts">
import type { CheckoutMode } from '~/types/checkout'

defineProps<{
  modelValue: CheckoutMode
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: CheckoutMode): void
}>()
</script>

<template>
  <div class="bg-white rounded-3xl p-6 border border-[#4A5D23]/10 shadow-soft-sm space-y-4">
    <div class="flex items-center gap-2 pb-3 border-b border-[#4A5D23]/10">
      <Icon name="lucide:truck" class="w-5 h-5 text-[#4A5D23]" />
      <h2 class="font-playfair font-bold text-lg text-[#2A321B]">Modalidad de Pedido</h2>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Modalidad de pedido">
      <!-- Opción 1: Envío Directo -->
      <button
        type="button"
        role="radio"
        :aria-checked="modelValue === 'direct'"
        @click="emit('update:modelValue', 'direct')"
        :class="[
          'p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between gap-3',
          modelValue === 'direct'
            ? 'border-[#4A5D23] bg-[#F4F1E1]/40 shadow-xs'
            : 'border-[#4A5D23]/15 hover:border-[#4A5D23]/40 bg-white'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-[#4A5D23]/10 flex items-center justify-center text-[#4A5D23]">
            <Icon name="lucide:map-pin" class="w-5 h-5" />
          </div>
          <span
            v-if="modelValue === 'direct'"
            class="w-5 h-5 rounded-full bg-[#4A5D23] text-white flex items-center justify-center text-xs"
          >
            <Icon name="lucide:check" class="w-3.5 h-3.5" />
          </span>
        </div>
        <div>
          <h3 class="font-bold text-sm text-[#2A321B]">Envío a Domicilio</h3>
          <p class="text-xs text-[#4A5D23]/70 font-medium mt-0.5">Ingresa tu dirección y horario de entrega programada.</p>
        </div>
      </button>

      <!-- Opción 2: Coordinar por WhatsApp -->
      <button
        type="button"
        role="radio"
        :aria-checked="modelValue === 'chat'"
        @click="emit('update:modelValue', 'chat')"
        :class="[
          'p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between gap-3',
          modelValue === 'chat'
            ? 'border-[#4A5D23] bg-[#F4F1E1]/40 shadow-xs'
            : 'border-[#4A5D23]/15 hover:border-[#4A5D23]/40 bg-white'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
            <Icon name="lucide:message-circle" class="w-5 h-5" />
          </div>
          <span
            v-if="modelValue === 'chat'"
            class="w-5 h-5 rounded-full bg-[#4A5D23] text-white flex items-center justify-center text-xs"
          >
            <Icon name="lucide:check" class="w-3.5 h-3.5" />
          </span>
        </div>
        <div>
          <h3 class="font-bold text-sm text-[#2A321B]">Coordinar por WhatsApp</h3>
          <p class="text-xs text-[#4A5D23]/70 font-medium mt-0.5">Define detalles o recojo directamente con nosotros por chat.</p>
        </div>
      </button>
    </div>
  </div>
</template>
