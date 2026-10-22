<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CheckoutMode, CheckoutFormData, DeliverySlot } from '~/types/checkout'
import CustomDatePicker from '~/components/ui/CustomDatePicker.vue'
import CustomTimePicker from '~/components/ui/CustomTimePicker.vue'
import UiCustomSelect, { type SelectOption } from '~/components/ui/CustomSelect.vue'

const slotOptions: SelectOption[] = [
  { label: 'Mañana: 08:00 AM - 10:00 AM', value: 'morning', sublabel: 'Antes de oficina / entrega matutina' },
  { label: 'Noche: 07:00 PM - 10:00 PM', value: 'night', sublabel: 'Retorno a casa / motorizado nocturno' },
  { label: 'En el día: Previa coordinación por WhatsApp', value: 'special', sublabel: 'Entrega en ruta o despacho desde taller' }
]

const props = defineProps<{
  mode: CheckoutMode
  formData: CheckoutFormData
}>()

defineEmits<{
  (e: 'update:formData', val: CheckoutFormData): void
}>()

// Establecer valores por defecto si no vienen definidos
if (!props.formData.deliveryMode) {
  props.formData.deliveryMode = 'delivery'
}
if (!props.formData.deliverySlot) {
  props.formData.deliverySlot = 'morning'
}

// Calcular fecha minima de entrega (regla de corte a las 4:30 PM / 16:30)
const minDeliveryDate = computed<Date>(() => {
  if (props.formData.isCustomSchedule) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  const now = new Date()
  const cutoffHour = 16
  const cutoffMinute = 30
  const isAfterCutoff = now.getHours() > cutoffHour || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute)
  
  // Si entra antes de las 4:30 PM: 36h a 48h (+2 dias)
  // Si entra despues de las 4:30 PM: salta un dia mas (+3 dias)
  const daysToAdd = isAfterCutoff ? 3 : 2
  const minDate = new Date(now)
  minDate.setDate(minDate.getDate() + daysToAdd)
  minDate.setHours(0, 0, 0, 0)
  return minDate
})

function setDeliverySlot(slot: DeliverySlot) {
  props.formData.deliverySlot = slot
  if (slot === 'morning') {
    props.formData.deliveryTime = '08:00 - 10:00'
  } else if (slot === 'night') {
    props.formData.deliveryTime = '19:00 - 22:00'
  } else {
    props.formData.deliveryTime = 'Por coordinar'
  }
}

// Sincronizar deliveryTime al cambiar slot o checkbox de horario especial
watch(() => props.formData.deliverySlot, (slot) => {
  if (!props.formData.isCustomSchedule) {
    if (slot === 'morning') props.formData.deliveryTime = '08:00 - 10:00'
    else if (slot === 'night') props.formData.deliveryTime = '19:00 - 22:00'
    else props.formData.deliveryTime = 'Por coordinar'
  }
})
</script>

<template>
  <div class="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#4A5D23]/10 shadow-soft-sm space-y-4 sm:space-y-6">
    <div class="flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-[#4A5D23]/10">
      <Icon name="lucide:user" class="w-4 h-4 sm:w-5 sm:h-5 text-[#4A5D23]" />
      <h2 class="font-playfair font-bold text-base sm:text-lg text-[#2A321B]">Datos del Cliente y Entrega</h2>
    </div>

    <!-- Nombre y Telefono -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label for="checkout-customer-name" class="block text-[11px] sm:text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1 sm:mb-1.5">
          Nombre Completo <span class="text-status-danger">*</span>
        </label>
        <input
          id="checkout-customer-name"
          v-model="formData.name"
          type="text"
          required
          aria-required="true"
          autocomplete="name"
          placeholder="Ej: Lucia Benavides"
          class="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-xl text-xs sm:text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] focus-visible:ring-2 focus-visible:ring-[#4A5D23] focus:bg-white transition-all shadow-xs"
        />
      </div>

      <div>
        <label for="checkout-customer-phone" class="block text-[11px] sm:text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1 sm:mb-1.5 flex justify-between items-center">
          <span>Telefono (WhatsApp) <span v-if="mode === 'direct'" class="text-status-danger">*</span></span>
          <span v-if="formData.phone && formData.phone.length === 9 && formData.phone.startsWith('9')" class="text-[10px] sm:text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <Icon name="lucide:check-circle-2" class="w-3.5 h-3.5" /> 9 digitos
          </span>
          <span v-else-if="formData.phone" class="text-[10px] sm:text-[11px] font-bold text-status-danger">
            {{ formData.phone.length }}/9 digitos
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
            'w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F4F1E1]/40 border rounded-xl text-xs sm:text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus-visible:ring-2 transition-all shadow-xs',
            formData.phone && (formData.phone.length !== 9 || !formData.phone.startsWith('9'))
              ? 'border-status-danger/60 focus:border-status-danger focus-visible:ring-status-danger/30'
              : 'border-[#4A5D23]/20 focus:border-[#4A5D23] focus-visible:ring-[#4A5D23] focus:bg-white'
          ]"
        />
        <p v-if="formData.phone && (!formData.phone.startsWith('9') || formData.phone.length < 9)" class="text-[10px] sm:text-[11px] text-status-danger font-semibold mt-1 flex items-center gap-1">
          <Icon name="lucide:alert-circle" class="w-3 h-3 shrink-0" />
          El numero debe tener 9 digitos y empezar con 9.
        </p>
      </div>
    </div>

    <!-- Campos de Entrega Programada (Modo Direct) -->
    <div v-if="mode === 'direct'" class="space-y-3 sm:space-y-4 pt-2 border-t border-[#4A5D23]/10">
      <!-- Caso A: Delivery a Domicilio -->
      <div v-if="formData.deliveryMode === 'delivery'">
        <label for="checkout-customer-address" class="block text-[11px] sm:text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1 sm:mb-1.5">
          Direccion de Entrega a Domicilio <span class="text-status-danger">*</span>
        </label>
        <input
          id="checkout-customer-address"
          v-model="formData.address"
          type="text"
          required
          aria-required="true"
          autocomplete="street-address"
          placeholder="Ej: Av. Larco 450, Dpto 302, Miraflores"
          class="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-xl text-xs sm:text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] focus-visible:ring-2 focus-visible:ring-[#4A5D23] focus:bg-white transition-all shadow-xs"
        />
      </div>

      <!-- Caso B: Punto de Encuentro Acordado -->
      <div v-else-if="formData.deliveryMode === 'meeting_point'" class="space-y-1.5 sm:space-y-2">
        <label for="checkout-customer-meeting-point" class="block text-[11px] sm:text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1 sm:mb-1.5">
          Punto de Encuentro Acordado <span class="text-status-danger">*</span>
        </label>
        <input
          id="checkout-customer-meeting-point"
          v-model="formData.meetingPointDetails"
          type="text"
          required
          aria-required="true"
          placeholder="Lugar o punto de encuentro acordado"
          class="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-xl text-xs sm:text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] focus-visible:ring-2 focus-visible:ring-[#4A5D23] focus:bg-white transition-all shadow-xs"
        />
        <p class="text-[11px] sm:text-xs text-[#4A5D23]/80 flex items-start gap-1.5 font-medium leading-snug">
          <Icon name="lucide:info" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Sin costo previa coordinacion para pedidos de facil transporte. Pedidos grandes requieren un costo de envio y se coordinan por WhatsApp.
          </span>
        </p>
      </div>

      <!-- Fecha y Franja Horaria de Entrega -->
      <div class="space-y-3 pt-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label for="checkout-delivery-date" class="block text-[11px] sm:text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1 sm:mb-1.5 flex items-center justify-between">
              <span>Fecha de Entrega</span>
              <span class="text-[10px] sm:text-[11px] text-[#4A5D23]/70 font-normal">Anticipacion: 36h-48h</span>
            </label>
            <CustomDatePicker
              id="checkout-delivery-date"
              v-model="formData.deliveryDate"
              :min-date="minDeliveryDate"
            />
          </div>

          <div>
            <label class="block text-[11px] sm:text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1 sm:mb-1.5">
              Franja Horaria Preferida
            </label>
            <UiCustomSelect
              v-if="!formData.isCustomSchedule"
              :options="slotOptions"
              :modelValue="formData.deliverySlot || 'morning'"
              size="md"
              icon="lucide:clock"
              bgClass="bg-[#F4F1E1]/40"
              buttonClass="!py-2 sm:!py-2.5"
              @update:model-value="setDeliverySlot(String($event) as DeliverySlot)"
            />
            <CustomTimePicker
              v-else
              id="checkout-delivery-time"
              v-model="formData.deliveryTime"
            />
          </div>
        </div>

        <!-- Casilla de excepcion para horario especial o fecha anticipada -->
        <div class="bg-[#F4F1E1]/30 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#4A5D23]/15 space-y-2">
          <label class="flex items-start gap-2.5 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="formData.isCustomSchedule"
              class="mt-0.5 sm:mt-1 w-4 h-4 text-[#4A5D23] rounded border-[#4A5D23]/30 focus:ring-[#4A5D23] cursor-pointer"
            />
            <div>
              <span class="font-bold text-xs text-[#2A321B]">Requiero horario especial o entrega anticipada</span>
              <p class="text-[#2A321B]/70 mt-0.5 leading-snug text-[11px] sm:text-xs">
                Marca si requieres entrega urgente o acordaste un horario fuera de franja.
              </p>
            </div>
          </label>

          <div v-if="formData.isCustomSchedule" class="pt-2 border-t border-[#4A5D23]/10">
            <label for="checkout-custom-time-input" class="block text-[11px] sm:text-xs font-bold text-[#4A5D23] mb-1">
              Hora o rango deseado
            </label>
            <input
              id="checkout-custom-time-input"
              v-model="formData.deliveryTime"
              type="text"
              placeholder="Ej: 04:30 PM (salida de oficina) o 11:00 AM"
              class="w-full px-3 py-2 bg-white border border-[#4A5D23]/20 rounded-xl text-xs font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] shadow-xs"
            />
          </div>
        </div>

        <!-- Alerta informativa compacta sobre motorizado y entregas diurnas -->
        <div class="p-2.5 sm:p-3 bg-brand-primary/5 rounded-xl sm:rounded-2xl border border-brand-primary/10 flex items-start gap-2 sm:gap-2.5">
          <Icon name="lucide:info" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4A5D23] shrink-0 mt-0.5" />
          <p class="text-[11px] sm:text-xs text-[#2A321B]/80 leading-snug font-medium">
            Entregas de lunes a viernes se pueden coordinar vía motorizado por WhatsApp según disponibilidad.
          </p>
        </div>
      </div>
    </div>

    <!-- Notas / Indicaciones Especiales -->
    <div>
      <label for="checkout-customer-notes" class="block text-[11px] sm:text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1 sm:mb-1.5">
        Indicaciones o Dedicatoria Especial
      </label>
      <textarea
        id="checkout-customer-notes"
        v-model="formData.notes"
        rows="2"
        maxlength="500"
        placeholder="Mensaje de dedicatoria, detalles de entrega, etc."
        class="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-xl text-xs sm:text-sm font-medium text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] focus:bg-white transition-all shadow-xs"
      ></textarea>
      <div class="flex justify-end mt-1">
        <span class="text-[10px] text-[#4A5D23]/60 font-medium">
          {{ formData.notes ? formData.notes.length : 0 }} / 500 caracteres
        </span>
      </div>
    </div>
  </div>
</template>
