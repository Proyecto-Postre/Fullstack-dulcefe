<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useCheckout } from '~/composables/useCheckout'
import type { CheckoutMode, CheckoutFormData, CheckoutPayload } from '~/types/checkout'
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '~/utils/whatsapp'
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

// Redirigir al inicio si el carrito está vacío
if (import.meta.client && cartStore.items.length === 0) {
  navigateTo('/')
}

watch(() => cartStore.items.length, (newLength) => {
  if (newLength === 0 && import.meta.client) {
    navigateTo('/')
  }
})

const isPhoneValid = computed<boolean>(() => {
  const p = formData.value.phone.trim()
  if (!p) {
    return checkoutMode.value === 'chat'
  }
  return p.length === 9 && p.startsWith('9')
})

const isFormValid = computed<boolean>(() => {
  const hasName = formData.value.name.trim().length >= 2
  if (!isPhoneValid.value) return false
  if (checkoutMode.value === 'chat') {
    return hasName
  }
  const hasPhone = formData.value.phone.trim().length === 9
  const hasAddress = formData.value.address.trim().length >= 5
  return hasName && hasPhone && hasAddress
})

async function processCheckout(): Promise<void> {
  if (!isPhoneValid.value && formData.value.phone.trim()) {
    toast.error('El teléfono debe tener 9 dígitos y empezar con 9')
    return
  }

  if (!isFormValid.value || isSubmitting.value) {
    toast.error('Por favor completa todos los campos requeridos correctamente')
    return
  }

  const payload: CheckoutPayload = {
    channel: checkoutMode.value === 'direct' ? 'direct' : 'whatsapp_chat',
    customer_name: formData.value.name.trim(),
    customer_phone: formData.value.phone.trim() || undefined,
    address: checkoutMode.value === 'direct' ? formData.value.address.trim() : undefined,
    delivery_date: formData.value.deliveryDate || undefined,
    delivery_time: formData.value.deliveryTime || undefined,
    notes: formData.value.notes.trim() || undefined,
    payment_method: formData.value.paymentMethod || 'cash',
    payment_reference: formData.value.paymentReference?.trim() || undefined,
    payment_receipt_url: formData.value.paymentReceiptUrl?.trim() || undefined,
    items: cartStore.items.map(item => ({
      product_id: Number(item.product_id),
      quantity: item.quantity
    }))
  }

  const result = await submitCheckout(payload)
  if (!result) {
    if (errorMessage.value) {
      toast.error(errorMessage.value)
    }
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return
  }

  const { order } = result

  // Construir mensaje de WhatsApp con los datos oficiales devueltos por el servidor
  const message = buildWhatsAppOrderMessage({
    orderId: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    mode: checkoutMode.value,
    address: order.address,
    deliveryDate: order.delivery_date,
    deliveryTime: order.delivery_time,
    notes: order.notes,
    items: order.items,
    totalAmount: order.total_amount
  })

  const whatsappNumber = (config.public.whatsappNumber as string) || '51998265700'
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, message)

  cartStore.clearCart()

  if (typeof window !== 'undefined') {
    window.location.href = whatsappUrl
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1]/30 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-8">
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
          />
          <CheckoutItemsList />
        </div>

        <!-- Columna Derecha: Resumen de Compra -->
        <div class="lg:col-span-1">
          <CheckoutSummaryCard
            :mode="checkoutMode"
            :is-valid="isFormValid"
            :is-submitting="isSubmitting"
            @submit="processCheckout"
          />
        </div>
      </div>
    </div>
  </div>
</template>
