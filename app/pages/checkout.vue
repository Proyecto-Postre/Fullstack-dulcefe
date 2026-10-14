<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useCheckout } from '~/composables/useCheckout'
import type { CheckoutMode, CheckoutFormData, CheckoutPayload } from '~/types/checkout'
import CheckoutModeSelector from '~/components/checkout/CheckoutModeSelector.vue'
import CheckoutCustomerForm from '~/components/checkout/CheckoutCustomerForm.vue'
import CheckoutPaymentSection from '~/components/checkout/CheckoutPaymentSection.vue'
import CheckoutItemsList from '~/components/checkout/CheckoutItemsList.vue'
import CheckoutSummaryCard from '~/components/checkout/CheckoutSummaryCard.vue'
import CheckoutErrorAlert from '~/components/checkout/CheckoutErrorAlert.vue'

import { toast } from 'vue-sonner'

const cartStore = useCartStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const { isSubmitting, errorMessage, errorDetails, submitCheckout } = useCheckout()

const checkoutMode = ref<CheckoutMode>('direct')
const isUploadingReceipt = ref<boolean>(false)

const formData = ref<CheckoutFormData>({
  name: '',
  phone: '',
  address: '',
  deliveryDate: '',
  deliveryTime: '',
  notes: '',
  paymentMethod: 'cash',
  paymentReference: '',
  paymentReceiptUrl: ''
})

function autoFillUserData() {
  if (!authStore.isLoggedIn) return
  if (!formData.value.name) {
    formData.value.name = authStore.profile?.full_name || authStore.user?.user_metadata?.full_name || ''
  }
  if (!formData.value.phone) {
    const rawPhone = authStore.profile?.phone || authStore.user?.user_metadata?.phone || ''
    formData.value.phone = rawPhone.replace(/\D/g, '').slice(0, 9)
  }
  if (!formData.value.address && authStore.addresses && authStore.addresses.length > 0) {
    const def = authStore.addresses.find(a => a.is_default) || authStore.addresses[0]
    if (def?.address_line) {
      formData.value.address = def.address_line
    }
  }
}

onMounted(async () => {
  if (authStore.isLoggedIn) {
    if (!authStore.profile) await authStore.fetchProfile()
    if (!authStore.addresses || authStore.addresses.length === 0) await authStore.fetchAddresses()
    autoFillUserData()
  }
})

watch(() => [authStore.profile, authStore.addresses], () => {
  autoFillUserData()
}, { deep: true })

const isOrderCompleted = ref(false)

// Redirigir al inicio si el carrito está vacío inicialmente
if (import.meta.client && cartStore.items.length === 0) {
  navigateTo('/')
}

watch(() => cartStore.items.length, (newLength) => {
  if (newLength === 0 && import.meta.client && !isOrderCompleted.value) {
    navigateTo('/')
  }
})

const isPhoneValid = computed<boolean>(() => {
  const p = formData.value.phone.replace(/\D/g, '')
  if (!p) {
    return checkoutMode.value === 'chat'
  }
  const clean = (p.startsWith('51') && p.length === 11) ? p.slice(2) : p
  return clean.length === 9 && clean.startsWith('9')
})

const isFormValid = computed<boolean>(() => {
  const hasName = formData.value.name.trim().length >= 2
  if (!isPhoneValid.value) return false
  if (checkoutMode.value === 'chat') {
    return hasName
  }
  const rawP = formData.value.phone.replace(/\D/g, '')
  const cleanP = (rawP.startsWith('51') && rawP.length === 11) ? rawP.slice(2) : rawP
  const hasPhone = cleanP.length === 9 && cleanP.startsWith('9')
  const hasAddress = formData.value.address.trim().length >= 5
  return hasName && hasPhone && hasAddress
})

async function processCheckout(): Promise<void> {
  const rawPhone = formData.value.phone.replace(/\D/g, '')
  const cleanPhone = (rawPhone.startsWith('51') && rawPhone.length === 11) ? rawPhone.slice(2) : rawPhone

  if (!isPhoneValid.value && formData.value.phone.trim()) {
    toast.error('El teléfono debe tener 9 dígitos y empezar con 9')
    return
  }

  if (!isFormValid.value || isSubmitting.value) {
    toast.error('Por favor completa todos los campos requeridos correctamente')
    return
  }

  function resolveProductId(rawId: string | number, name?: string): number {
    const num = Number(rawId)
    if (!isNaN(num) && Number.isInteger(num) && num > 0) return num
    const lower = (name || '').toLowerCase()
    if (rawId === 'fav-3' || lower.includes('cheesecake')) return 12
    if (rawId === 'fav-1' || lower.includes('chocolate')) return 13
    if (rawId === 'fav-2' || lower.includes('tartaleta') || lower.includes('brownie')) return 10
    if (lower.includes('alfajor')) return 11
    return 12
  }

  function formatDeliveryDate(raw?: string): string | undefined {
    if (!raw) return undefined
    const trimmed = raw.trim()
    if (!trimmed) return undefined
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const parts = trimmed.split(/[/ -]/)
    if (parts.length === 3 && (parts[0]?.length || 0) <= 2 && (parts[1]?.length || 0) <= 2 && (parts[2]?.length || 0) === 4) {
      return `${parts[2]}-${parts[1]!.padStart(2, '0')}-${parts[0]!.padStart(2, '0')}`
    }
    return trimmed
  }

  function formatDeliveryTime(raw?: string): string | undefined {
    if (!raw) return undefined
    const trimmed = raw.trim()
    if (!trimmed) return undefined
    if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) return trimmed
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
    if (match) {
      let hours = parseInt(match[1]!, 10)
      const minutes = match[2]!
      const period = match[3]!.toUpperCase()
      if (period === 'PM' && hours < 12) hours += 12
      else if (period === 'AM' && hours === 12) hours = 0
      return `${String(hours).padStart(2, '0')}:${minutes}`
    }
    return trimmed
  }

  const payload: CheckoutPayload = {
    channel: checkoutMode.value === 'direct' ? 'direct' : 'whatsapp_chat',
    customer_name: formData.value.name.trim(),
    customer_phone: cleanPhone || undefined,
    address: checkoutMode.value === 'direct' ? formData.value.address.trim() : undefined,
    delivery_date: formatDeliveryDate(formData.value.deliveryDate),
    delivery_time: formatDeliveryTime(formData.value.deliveryTime),
    notes: formData.value.notes.trim() || undefined,
    payment_method: formData.value.paymentMethod || 'cash',
    payment_reference: formData.value.paymentReference?.trim() || undefined,
    payment_receipt_url: formData.value.paymentReceiptUrl?.trim() || undefined,
    items: cartStore.items.map(item => ({
      product_id: resolveProductId(item.product_id, item.name),
      quantity: item.quantity
    }))
  }

  const result = await submitCheckout(payload)
  if (!result) {
    const firstDetail = errorDetails.value?.[0]?.message
    const msg = firstDetail || errorMessage.value || 'Ocurrió un problema al procesar tu pedido. Por favor intenta nuevamente.'
    toast.error(msg)
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return
  }

  const { order } = result

  isOrderCompleted.value = true
  cartStore.clearCart()

  toast.success('¡Pedido registrado con éxito!')

  if (order.tracking_token) {
    await navigateTo(`/pedido/${order.tracking_token}`)
  } else {
    await navigateTo('/menu')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1]/30 py-8 px-4 sm:px-6 lg:px-12">
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Breadcrumb y Título -->
      <div class="flex items-center justify-between">
        <div>
          <NuxtLink
            to="/menu"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A5D23] hover:underline mb-1"
          >
            <Icon name="lucide:arrow-left" class="w-4 h-4" />
            Volver a la vitrina
          </NuxtLink>
          <h1 class="text-3xl font-playfair font-black text-[#2A321B]">Finalizar Pedido</h1>
        </div>
      </div>

      <!-- Alerta de Errores de API -->
      <CheckoutErrorAlert
        :error-message="errorMessage"
        :error-details="errorDetails"
      />

      <!-- Layout en 2 Columnas -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <!-- Columna Izquierda: Modalidad + Formulario + Pago + Ítems -->
        <div class="lg:col-span-2 space-y-6">
          <CheckoutModeSelector v-model="checkoutMode" />
          <CheckoutCustomerForm :mode="checkoutMode" :form-data="formData" />
          <CheckoutPaymentSection
            :payment-method="formData.paymentMethod || 'cash'"
            :payment-reference="formData.paymentReference || ''"
            :payment-receipt-url="formData.paymentReceiptUrl || ''"
            @update:payment-method="formData.paymentMethod = $event"
            @update:payment-reference="formData.paymentReference = $event"
            @update:payment-receipt-url="formData.paymentReceiptUrl = $event"
            @update:is-uploading="isUploadingReceipt = $event"
          />
          <CheckoutItemsList />
        </div>

        <!-- Columna Derecha: Resumen de Compra -->
        <div class="lg:col-span-1">
          <CheckoutSummaryCard
            :mode="checkoutMode"
            :is-valid="isFormValid"
            :is-submitting="isSubmitting"
            :is-uploading="isUploadingReceipt"
            :payment-method="formData.paymentMethod || 'cash'"
            @submit="processCheckout"
          />
        </div>
      </div>
    </div>
  </div>
</template>
