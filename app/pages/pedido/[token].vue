<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { PublicOrderTrackingDTO } from '~/types/tracking'
import { buildWhatsAppUrl } from '~/utils/whatsapp'

const route = useRoute()
const token = route.params.token as string

// Consulta reactiva del estado de la orden
const { data: order, pending, error, refresh } = await useFetch<PublicOrderTrackingDTO>(
  () => `/api/orders/track/${token}`,
  { key: `order-tracking-${token}` }
)

// Polling inteligente cada 30 segundos si la pestaña está activa
let pollTimer: ReturnType<typeof setInterval> | null = null

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refresh()
  }
}

onMounted(() => {
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      refresh()
    }
  }, 30000)

  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// Enlace de soporte WhatsApp
const whatsappSupportUrl = ref('')
const config = useRuntimeConfig()
const businessPhone = (config.public?.whatsappNumber as string) || '51998265700'

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'ready':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-stone-100 text-stone-800 border-stone-300'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pedido Recibido'
    case 'processing':
      return 'En Taller / Horneado'
    case 'ready':
      return 'Listo para Despacho'
    case 'delivered':
      return 'Entregado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

if (order.value) {
  const msg = `¡Hola Dulce Fe! Tengo una consulta sobre mi pedido ${order.value.short_id}.`
  whatsappSupportUrl.value = buildWhatsAppUrl(businessPhone, msg)
}
</script>

<template>
  <div class="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Estado de Carga -->
      <div v-if="pending" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4A5D23] border-t-transparent mb-4" />
        <p class="text-stone-600 font-medium font-sans">Localizando tu pedido en taller...</p>
      </div>

      <!-- Estado de Error / Token Inválido o No Encontrado -->
      <div v-else-if="error || !order" class="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-stone-200 text-center">
        <div class="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="lucide:alert-triangle" class="w-8 h-8" />
        </div>
        <h1 class="text-2xl font-serif text-[#2A321B] font-bold mb-2">Pedido No Encontrado</h1>
        <p class="text-stone-600 mb-6 max-w-md mx-auto">
          El enlace de seguimiento no es válido o la orden ha expirado. Si realizaste un pedido recientemente, por favor contáctanos con tu comprobante.
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 px-6 py-3 bg-[#4A5D23] text-white font-medium rounded-full hover:bg-[#3d4d1c] transition-colors"
        >
          <Icon name="lucide:home" class="w-4 h-4" />
          Ir al Inicio
        </NuxtLink>
      </div>

      <!-- Vista Principal de Seguimiento -->
      <div v-else class="space-y-6">
        <!-- Cabecera de la Orden -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6 mb-6">
            <div>
              <div class="flex items-center gap-3">
                <span class="text-xs font-semibold uppercase tracking-wider text-stone-500 font-sans">
                  Seguimiento de Pedido
                </span>
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full border"
                  :class="getStatusBadgeClass(order.status)"
                >
                  {{ getStatusLabel(order.status) }}
                </span>
              </div>
              <h1 class="text-3xl font-serif font-bold text-[#2A321B] mt-1">
                ¡Hola, {{ order.customer_first_name }}!
              </h1>
              <p class="text-stone-500 text-sm mt-1 font-sans">
                Referencia oficial: <span class="font-bold text-[#4A5D23]">{{ order.short_id }}</span>
              </p>
            </div>

            <!-- Promesa de Entrega -->
            <div
              v-if="order.delivery_date"
              class="bg-[#F4F1E1] rounded-2xl p-4 sm:text-right border border-[#e5dfc5]"
            >
              <span class="text-xs text-stone-600 block font-sans">Entrega Programada</span>
              <p class="text-lg font-bold text-[#2A321B] font-serif">
                {{ order.delivery_date }}
                <span v-if="order.delivery_time" class="text-sm font-sans font-normal text-stone-600">
                  ({{ order.delivery_time }})
                </span>
              </p>
            </div>
          </div>

          <!-- Alerta si la orden fue cancelada -->
          <div
            v-if="order.is_cancelled"
            class="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-3 mb-6"
            role="alert"
          >
            <Icon name="lucide:x-circle" class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-bold font-sans">Este pedido fue cancelado.</p>
              <p class="text-sm text-red-700">Para cualquier consulta o reprogramación, comunícate con nuestro taller vía WhatsApp.</p>
            </div>
          </div>

          <!-- Stepper Visual de Estados -->
          <div v-if="!order.is_cancelled" class="py-4" role="status" aria-live="polite">
            <h2 class="sr-only">Estado del Pedido</h2>
            <div class="relative">
              <!-- Línea conectora de fondo -->
              <div class="hidden sm:block absolute top-5 left-6 right-6 h-1 bg-stone-200" aria-hidden="true" />

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
                <div
                  v-for="(step, idx) in order.timeline"
                  :key="step.status"
                  class="flex sm:flex-col items-start sm:items-center text-left sm:text-center gap-4 sm:gap-2"
                >
                  <!-- Indicador circular del paso -->
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all flex-shrink-0 shadow-sm"
                    :class="[
                      step.current
                        ? 'bg-[#4A5D23] text-white ring-4 ring-[#4A5D23]/20 animate-pulse'
                        : step.completed
                          ? 'bg-[#4A5D23] text-white'
                          : 'bg-stone-200 text-stone-500'
                    ]"
                  >
                    <Icon v-if="step.completed && !step.current" name="lucide:check" class="w-5 h-5" />
                    <span v-else>{{ idx + 1 }}</span>
                  </div>

                  <!-- Textos del paso -->
                  <div>
                    <p
                      class="font-semibold text-sm font-sans"
                      :class="step.current || step.completed ? 'text-[#2A321B]' : 'text-stone-400'"
                    >
                      {{ step.label }}
                    </p>
                    <p class="text-xs text-stone-500 mt-0.5 sm:max-w-[140px]">
                      {{ step.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen de Productos Solicitados -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
          <h2 class="text-xl font-serif font-bold text-[#2A321B] mb-4 flex items-center gap-2">
            <Icon name="lucide:shopping-bag" class="w-5 h-5 text-[#4A5D23]" />
            Detalle del Pedido
          </h2>
          <ul class="divide-y divide-stone-100 font-sans">
            <li
              v-for="item in order.items"
              :key="item.name"
              class="py-3 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 bg-[#F4F1E1] text-[#4A5D23] font-bold rounded-lg flex items-center justify-center text-xs">
                  {{ item.quantity }}x
                </span>
                <span class="text-stone-800 font-medium text-sm">{{ item.name }}</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- Tarjeta de Soporte y Preguntas -->
        <div class="bg-gradient-to-r from-[#F4F1E1] to-[#ebe5d3] rounded-3xl p-6 sm:p-8 border border-[#ded8c4] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 class="text-lg font-serif font-bold text-[#2A321B]">¿Tienes alguna pregunta sobre tu entrega?</h3>
            <p class="text-stone-600 text-sm mt-1 font-sans">
              Estamos en línea para coordinar detalles especiales de tu pedido.
            </p>
          </div>
          <a
            :href="whatsappSupportUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3.5 bg-[#4A5D23] text-white font-medium rounded-full hover:bg-[#3d4d1c] transition-all shadow-sm flex-shrink-0"
          >
            <Icon name="lucide:message-circle" class="w-5 h-5 text-white" />
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
