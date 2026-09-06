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

onMounted(() => {
  if (authStore.isLoggedIn && authStore.user) {
    formData.value.name = authStore.user.user_metadata?.full_name || authStore.profile?.full_name || ''
    formData.value.phone = authStore.profile?.phone || ''
  }
})

// Redirigir al inicio si el carrito está vacío
if (import.meta.client && cartStore.items.length === 0) {
  navigateTo('/')
}

watch(() => cartStore.items.length, (newLength) => {
  if (newLength === 0 && import.meta.client) {
    navigateTo('/')
  }
})

const isFormValid = computed<boolean>(() => {
  if (checkoutMode.value === 'chat') {
    return formData.value.name.trim() !== ''
  }
  return formData.value.name.trim() !== '' && formData.value.address.trim() !== ''
})

async function processCheckout(): Promise<void> {
  if (!isFormValid.value || isSubmitting.value) return

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
  if (!result) return

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
