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

  const payload: CheckoutPayload = {
    channel: checkoutMode.value === 'direct' ? 'direct' : 'whatsapp_chat',
    customer_name: formData.value.name.trim(),
    customer_phone: cleanPhone || undefined,
    address: checkoutMode.value === 'direct' ? formData.value.address.trim() : undefined,
    delivery_date: formData.value.deliveryDate || undefined,
    delivery_time: formData.value.deliveryTime || undefined,
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
    const msg = errorMessage.value || 'Ocurrió un problema al procesar tu pedido. Por favor intenta nuevamente.'
    toast.error(msg)
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

  isOrderCompleted.value = true
  cartStore.clearCart()

  if (typeof window !== 'undefined') {
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = whatsappUrl
    } else {
      const newTab = window.open(whatsappUrl, '_blank')
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        window.location.href = whatsappUrl
      } else if (order.tracking_token) {
        await navigateTo(`/pedido/${order.tracking_token}`)
      }
    }
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
