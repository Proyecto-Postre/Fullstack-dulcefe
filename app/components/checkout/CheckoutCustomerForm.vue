<script setup lang="ts">
import type { CheckoutMode, CheckoutFormData } from '~/types/checkout'
import CustomDatePicker from '~/components/ui/CustomDatePicker.vue'
import CustomTimePicker from '~/components/ui/CustomTimePicker.vue'

defineProps<{
  mode: CheckoutMode
  formData: CheckoutFormData
}>()

defineEmits<{
  (e: 'update:formData', val: CheckoutFormData): void
}>()
</script>

<template>
  <div class="bg-white rounded-3xl p-6 border border-[#4A5D23]/10 shadow-soft-sm space-y-5">
    <div class="flex items-center gap-2 pb-3 border-b border-[#4A5D23]/10">
      <Icon name="lucide:user" class="w-5 h-5 text-[#4A5D23]" />
      <h2 class="font-playfair font-bold text-lg text-[#2A321B]">Datos del Cliente y Entrega</h2>
    </div>

    <!-- Nombre y Teléfono -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="checkout-customer-name" class="block text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1.5">
          Nombre Completo <span class="text-status-danger">*</span>
        </label>
        <input
          id="checkout-customer-name"
          v-model="formData.name"
          type="text"
          required
          aria-required="true"
          autocomplete="name"
          placeholder="Ej: Lucía Benavides"
          class="w-full px-4 py-3 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-xl text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] focus-visible:ring-2 focus-visible:ring-[#4A5D23] focus:bg-white transition-all shadow-xs"
        />
      </div>

      <div>
        <label for="checkout-customer-phone" class="block text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1.5 flex justify-between items-center">
          <span>Teléfono (WhatsApp) <span v-if="mode === 'direct'" class="text-status-danger">*</span></span>
          <span v-if="formData.phone && formData.phone.length === 9 && formData.phone.startsWith('9')" class="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <Icon name="lucide:check-circle-2" class="w-3.5 h-3.5" /> 9 dígitos
          </span>
          <span v-else-if="formData.phone" class="text-[11px] font-bold text-status-danger">
            {{ formData.phone.length }}/9 dígitos
          </span>
        </label>
        <input
          id="checkout-customer-phone"
          :value="formData.phone"
          @input="formData.phone = ($event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 9)"
          type="tel"
          maxlength="9"
          autocomplete="tel"
          placeholder="Ej: 987654321"
          :class="[
            'w-full px-4 py-3 bg-[#F4F1E1]/40 border rounded-xl text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus-visible:ring-2 transition-all shadow-xs',
            formData.phone && (formData.phone.length !== 9 || !formData.phone.startsWith('9'))
              ? 'border-status-danger/60 focus:border-status-danger focus-visible:ring-status-danger/30'
              : 'border-[#4A5D23]/20 focus:border-[#4A5D23] focus-visible:ring-[#4A5D23] focus:bg-white'
          ]"
        />
        <p v-if="formData.phone && (!formData.phone.startsWith('9') || formData.phone.length < 9)" class="text-[11px] text-status-danger font-semibold mt-1 flex items-center gap-1">
          <Icon name="lucide:alert-circle" class="w-3 h-3 shrink-0" />
          El número de Perú debe empezar con 9 y tener 9 dígitos.
        </p>
      </div>
    </div>

    <!-- Dirección (Solo si es modo direct) -->
    <div v-if="mode === 'direct'">
      <label for="checkout-customer-address" class="block text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1.5">
        Dirección de Entrega <span class="text-status-danger">*</span>
      </label>
      <input
        id="checkout-customer-address"
        v-model="formData.address"
        type="text"
        required
        aria-required="true"
        autocomplete="street-address"
        placeholder="Ej: Av. Larco 450, Dpto 302, Miraflores"
        class="w-full px-4 py-3 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-xl text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] focus-visible:ring-2 focus-visible:ring-[#4A5D23] focus:bg-white transition-all shadow-xs"
      />
    </div>

    <!-- Fecha y Hora de Entrega (Modo direct) -->
    <div v-if="mode === 'direct'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="checkout-delivery-date" class="block text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1.5">
          Fecha de Entrega
        </label>
        <CustomDatePicker
          id="checkout-delivery-date"
          v-model="formData.deliveryDate"
        />
      </div>

      <div>
        <label for="checkout-delivery-time" class="block text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1.5">
          Hora de Entrega
        </label>
        <CustomTimePicker
          id="checkout-delivery-time"
          v-model="formData.deliveryTime"
        />
      </div>
    </div>

    <!-- Notas / Indicaciones Especiales -->
    <div>
      <label for="checkout-customer-notes" class="block text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1.5">
        Indicaciones o Dedicatoria Especial
      </label>
      <textarea
        id="checkout-customer-notes"
        v-model="formData.notes"
        rows="2"
        maxlength="500"
        placeholder="Ej: Mensaje especial en la tarjeta, timbre averiado, etc."
        class="w-full px-4 py-3 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-xl text-sm font-medium text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] focus:bg-white transition-all shadow-xs"
      ></textarea>
      <div class="flex justify-end mt-1">
        <span class="text-[10px] text-[#4A5D23]/60 font-medium">
          {{ formData.notes.length }} / 500 caracteres
        </span>
      </div>
    </div>
  </div>
</template>
