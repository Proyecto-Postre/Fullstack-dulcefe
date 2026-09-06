<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useCheckout } from '~/composables/useCheckout'
import type { CheckoutBodyDTO } from '~~/server/utils/schemas/checkout'
import CustomDatePicker from '~/components/ui/CustomDatePicker.vue'
import CustomTimePicker from '~/components/ui/CustomTimePicker.vue'

const cartStore = useCartStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const { isSubmitting, errorMessage, errorDetails, submitCheckout } = useCheckout()

const checkoutMode = ref<'direct' | 'chat'>('direct')
const editingItemId = ref<string | number | null>(null)

const formData = ref({
  name: '',
  phone: '',
  address: '',
  deliveryDate: '',
  deliveryTime: '',
  notes: ''
})

onMounted(() => {
  if (authStore.isLoggedIn && authStore.user) {
    formData.value.name = authStore.user.user_metadata?.full_name || ''
    formData.value.phone = authStore.profile?.phone || ''
  }
})

// Redirigir al inicio si el carrito está vacío
if (import.meta.client && cartStore.items.length === 0) {
  navigateTo('/')
}

watch(() => cartStore.items.length, (newLength) => {
  if (newLength === 0) {
    navigateTo('/')
  }
})

const isFormValid = computed(() => {
  if (checkoutMode.value === 'chat') {
    return formData.value.name.trim() !== ''
  } else {
    return formData.value.name.trim() !== '' && formData.value.address.trim() !== ''
  }
})

const processCheckout = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  const payload: CheckoutBodyDTO = {
    channel: checkoutMode.value === 'direct' ? 'direct' : 'whatsapp_chat',
    customer_name: formData.value.name.trim(),
    customer_phone: formData.value.phone.trim() || undefined,
    address: checkoutMode.value === 'direct' ? formData.value.address.trim() : undefined,
    delivery_date: formData.value.deliveryDate || undefined,
    delivery_time: formData.value.deliveryTime || undefined,
    notes: formData.value.notes.trim() || undefined,
    items: cartStore.items.map(item => ({
      product_id: Number(item.product_id),
      quantity: item.quantity
    }))
  }

  const result = await submitCheckout(payload)
  if (!result) return

  const { order } = result

  // Construir mensaje de WhatsApp con los datos oficiales devueltos por el servidor
  let message = `¡Hola Dulce Fe! Deseo coordinar el pedido *#${order.id.slice(0, 8)}*:\n\n`
  message += `*Cliente:* ${order.customer_name}\n`
  if (order.customer_phone) message += `*Teléfono:* ${order.customer_phone}\n`

  if (checkoutMode.value === 'direct') {
    message += `*Tipo de Entrega:* Envío a Domicilio\n`
    if (order.address) message += `*Dirección:* ${order.address}\n`
    if (order.delivery_date) message += `*Fecha:* ${order.delivery_date}\n`
    if (order.delivery_time) message += `*Hora:* ${order.delivery_time}\n`
    if (order.notes) message += `*Notas:* ${order.notes}\n`
  } else {
    message += `(Detalles de entrega a coordinar por chat)\n`
  }

  message += `\n*Detalle de Productos:*\n`
  order.items.forEach(item => {
    message += `- ${item.quantity}x ${item.name} (S/ ${item.price_at_time})\n`
  })

  message += `\n*Total a Pagar Oficial:* S/ ${order.total_amount}`

  const encodedMessage = encodeURIComponent(message)
  const whatsappNumber = config.public.whatsappNumber || '51998265700'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

  // Abrir WhatsApp en pestaña nueva
  window.open(whatsappUrl, '_blank')

  // Limpiar el carrito de compras y navegar al inicio
  cartStore.clearCart()
  navigateTo('/')
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-6">
    
    <!-- Encabezado de la Sección -->
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink to="/" class="w-10 h-10 flex items-center justify-center rounded-full border border-brand-primary/20 bg-surface text-brand-secondary hover:bg-brand-cream transition-colors shadow-soft-sm active:translate-y-0.5">
        <Icon name="lucide:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-3xl font-playfair font-black text-brand-secondary">Finalizar Pedido</h1>
        <p class="text-xs text-brand-primary font-medium mt-0.5">Completa tus datos para coordinar el envío de tus postres</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Formulario (Izquierda) -->
      <div class="lg:col-span-6 space-y-6">
        
        <!-- Selector de Modo -->
        <div class="bg-surface border border-brand-primary/20 rounded-2xl p-2 flex gap-2 shadow-soft-sm">
          <button 
            @click="checkoutMode = 'direct'"
            :class="[
              'flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-sm',
              checkoutMode === 'direct' 
                ? 'bg-brand-primary text-white border border-brand-primary/20 shadow-soft-sm' 
                : 'bg-transparent text-brand-primary hover:bg-brand-cream'
            ]"
          >
            <Icon name="lucide:zap" class="w-4 h-4" />
            Compra Directa
          </button>
          <button 
            @click="checkoutMode = 'chat'"
            :class="[
              'flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-sm',
              checkoutMode === 'chat' 
                ? 'bg-brand-primary text-white border border-brand-primary/20 shadow-soft-sm' 
                : 'bg-transparent text-brand-primary hover:bg-brand-cream'
            ]"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4" />
            Coordinar por Chat
          </button>
        </div>

        <div class="bg-surface/90 backdrop-blur-md border border-brand-primary/10 rounded-[2rem] p-8 shadow-soft-md">
          <h2 class="text-xl font-playfair font-bold text-brand-secondary mb-6 flex items-center gap-3">
            <Icon name="lucide:map-pin" class="w-5 h-5 text-brand-primary" />
            Datos de Entrega
          </h2>
          
          <p v-if="checkoutMode === 'chat'" class="text-sm text-brand-primary font-medium mb-6 leading-relaxed">
            Solo necesitamos tu nombre. La dirección exacta y la fecha de entrega las coordinaremos directamente contigo por WhatsApp.
          </p>
          <p v-else class="text-sm text-brand-primary font-medium mb-6 leading-relaxed">
            Completa todos tus datos para que podamos procesar y enviar tu pedido de inmediato.
          </p>

          <div class="space-y-5">
            <!-- Nombre -->
            <div class="space-y-2">
              <label for="name" class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Nombre Completo *</label>
              <input 
                id="name"
                v-model="formData.name"
                type="text" 
                placeholder="Ej. María Pérez"
                class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 shadow-soft-sm"
              >
            </div>

            <!-- Campos de Modo Directo -->
            <template v-if="checkoutMode === 'direct'">
              <!-- Teléfono -->
              <div class="space-y-2 animate-pop">
                <label for="phone" class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Teléfono (Opcional)</label>
                <input 
                  id="phone"
                  v-model="formData.phone"
                  type="tel" 
                  placeholder="Si es diferente al de WhatsApp"
                  class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 shadow-soft-sm"
                >
              </div>

              <!-- Dirección -->
              <div class="space-y-2 animate-pop">
                <label for="address" class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Dirección Exacta *</label>
                <textarea 
                  id="address"
                  v-model="formData.address"
                  rows="2"
                  placeholder="Calle, número, distrito, referencias..."
                  class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 resize-none shadow-soft-sm"
                ></textarea>
              </div>

              <!-- Fecha y Hora -->
              <div class="grid grid-cols-2 gap-4 animate-pop">
                <div class="space-y-2">
                  <label class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Fecha</label>
                  <CustomDatePicker v-model="formData.deliveryDate" bgClass="bg-brand-cream/60" />
                </div>
                <div class="space-y-2">
                  <label class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Hora Aprox.</label>
                  <CustomTimePicker v-model="formData.deliveryTime" bgClass="bg-brand-cream/60" />
                </div>
              </div>

              <!-- Notas -->
              <div class="space-y-2 animate-pop">
                <label for="notes" class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Preferencias / Notas</label>
                <textarea 
                  id="notes"
                  v-model="formData.notes"
                  rows="2"
                  placeholder="Ej. Sin pasas, poco dulce, dedicatoria especial..."
                  class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 resize-none shadow-soft-sm"
                ></textarea>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Resumen (Derecha) -->
      <div class="lg:col-span-6">
        <div class="bg-brand-secondary border border-brand-primary/20 rounded-[2rem] p-8 shadow-soft-md text-white sticky top-24">
          <h2 class="text-xl font-playfair font-bold mb-6 flex items-center gap-3 text-brand-cream">
            <Icon name="lucide:receipt" class="w-6 h-6 text-status-success" />
            Resumen del Pedido
          </h2>

          <div class="space-y-4 mb-8 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
            <div 
              v-for="item in cartStore.items" 
              :key="item.product_id"
              class="flex items-center gap-4 bg-white/10 rounded-xl p-3 border border-white/20"
            >
              <div class="w-12 h-12 rounded-lg bg-brand-cream overflow-hidden shrink-0">
                <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-brand-primary">
                  <Icon name="lucide:croissant" class="w-5 h-5" />
                </div>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-sm leading-tight text-brand-cream">{{ item.name }}</h3>
                
                <div v-if="editingItemId === item.product_id" class="flex flex-wrap items-center gap-2 mt-2 animate-pop">
                  <div class="flex items-center gap-1 bg-white/10 border border-white/20 rounded-lg p-1">
                    <button 
                      @click="cartStore.updateQuantity(item.product_id, item.quantity - 1)"
                      :disabled="item.quantity <= 1"
                      class="w-6 h-6 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >-</button>
                    <span class="w-6 text-center text-xs font-bold">{{ item.quantity }}</span>
                    <button 
                      @click="cartStore.updateQuantity(item.product_id, item.quantity + 1)"
                      class="w-6 h-6 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs"
                    >+</button>
                  </div>
                  <button 
                    @click="editingItemId = null"
                    class="text-[11px] bg-status-success text-brand-secondary font-bold px-2 py-1 rounded"
                  >Listo</button>
                  <button 
                    @click="cartStore.removeFromCart(item.product_id)"
                    class="text-[11px] text-red-300 hover:text-red-100 flex items-center gap-1 ml-auto"
                  >
                    <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div v-else class="flex items-center justify-between mt-1 text-xs text-brand-cream/70">
                  <span>{{ item.quantity }}x S/ {{ item.price.toFixed(2) }}</span>
                  <button 
                    @click="editingItemId = item.product_id"
                    class="text-xs text-status-success font-bold hover:underline"
                  >Editar</button>
                </div>
              </div>
              <div class="text-right font-black font-inter text-sm text-brand-cream">
                S/ {{ (item.price * item.quantity).toFixed(2) }}
              </div>
            </div>
          </div>

          <!-- Total y Botón de Enviar -->
          <div class="border-t border-white/20 pt-6 space-y-4">
            <div class="flex justify-between items-center text-sm text-brand-cream/80">
              <span>Subtotal</span>
              <span>S/ {{ cartStore.cartTotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center text-lg font-bold text-brand-cream">
              <span>Total Estimado</span>
              <span class="text-2xl font-black font-inter text-status-success">S/ {{ cartStore.cartTotal.toFixed(2) }}</span>
            </div>

            <!-- Banner de Error API -->
            <div v-if="errorMessage" class="bg-status-danger/20 border border-status-danger/40 rounded-xl p-3 text-brand-cream text-xs flex items-start gap-2">
              <Icon name="lucide:alert-circle" class="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
              <div>
                <p class="font-bold">{{ errorMessage }}</p>
                <ul v-if="errorDetails.length > 0" class="list-disc list-inside mt-1 space-y-0.5 text-brand-cream/80">
                  <li v-for="(detail, idx) in errorDetails" :key="idx">{{ detail.message }}</li>
                </ul>
              </div>
            </div>

            <button 
              @click="processCheckout"
              :disabled="!isFormValid || isSubmitting"
              class="w-full bg-status-success text-brand-secondary font-black py-4 rounded-xl shadow-soft-md hover:shadow-soft-lg transition-all active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider text-sm cursor-pointer mt-6"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-5 h-5 animate-spin" />
              <Icon v-else name="lucide:send" class="w-5 h-5" />
              {{ isSubmitting ? 'Procesando Pedido Oficial...' : 'Confirmar y Abrir WhatsApp' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
