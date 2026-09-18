<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import type { PublicOrderTrackingDTO } from '~/types/tracking'
import { buildWhatsAppUrl } from '~/utils/whatsapp'

const route = useRoute()
const token = route.params.token as string

// Consulta reactiva del estado de la orden
const { data: order, pending, error, refresh } = await useFetch<PublicOrderTrackingDTO>(
  () => `/api/orders/track/${token}`,
  { key: `order-tracking-${token}` }
)

// Suscripción en tiempo real vía Server-Sent Events (SSE) - Cero polling
let eventSource: EventSource | null = null

onMounted(() => {
  if (typeof window !== 'undefined' && 'EventSource' in window && token) {
    eventSource = new EventSource(`/api/orders/track/${token}/stream`)

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'order_updated') {
          // Actualización en tiempo real desde cocina/admin
          refresh()
          toast.info('Estado de tu pedido actualizado', {
            description: `Tu pedido ahora está: ${getStatusLabel(payload.status)}`
          })
        }
      } catch {
        // Ignorar eventos que no sean JSON o heartbeats
      }
    }

    eventSource.onerror = () => {
      // Reconexión automática nativa gestionada por el navegador
    }
  }
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
})

const config = useRuntimeConfig()
const businessPhone = (config.public?.whatsappNumber as string) || '51998265700'

// Enlace de soporte WhatsApp reactivo ante cualquier estado de carga del pedido
const whatsappSupportUrl = computed(() => {
  const shortId = order.value?.short_id || (token ? String(token).slice(0, 8) : '')
  const isPendingCoordination = order.value?.channel === 'whatsapp_chat' && order.value?.status === 'pending'
  const msg = isPendingCoordination
    ? `¡Hola Dulce Fe! Deseo coordinar la confirmación y entrega de mi pedido ${shortId}.`
    : shortId
      ? `¡Hola Dulce Fe! Tengo una consulta sobre mi pedido ${shortId}.`
      : '¡Hola Dulce Fe! Tengo una consulta sobre mi pedido.'
  return buildWhatsAppUrl(businessPhone, msg)
})

// Función para copiar el enlace de seguimiento al portapapeles
const isCopied = ref(false)
async function copyTrackingUrl() {
  if (typeof window === 'undefined') return
  try {
    await navigator.clipboard.writeText(window.location.href)
    isCopied.value = true
    toast.success('¡Enlace de seguimiento copiado al portapapeles!')
    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch {
    toast.error('No se pudo copiar el enlace. Puedes copiar la URL del navegador.')
  }
}

// Función para copiar la referencia del pedido
async function copyShortId() {
  if (!order.value?.short_id) return
  try {
    await navigator.clipboard.writeText(order.value.short_id)
    toast.success(`Referencia ${order.value.short_id} copiada`)
  } catch {
    // Ignorar si el navegador no tiene permiso
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-900 border-amber-300/70'
    case 'processing':
      return 'bg-blue-100 text-blue-900 border-blue-300/70'
    case 'ready':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300/70'
    case 'delivered':
      return 'bg-[#4A5D23]/15 text-[#2A321B] border-[#4A5D23]/30'
    case 'cancelled':
      return 'bg-red-100 text-red-900 border-red-300/70'
    default:
      return 'bg-stone-100 text-stone-800 border-stone-300'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return order.value?.channel === 'whatsapp_chat' ? 'Solicitud Recibida' : 'Pedido Registrado'
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

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending':
      return order.value?.channel === 'whatsapp_chat' ? 'lucide:message-square' : 'lucide:clipboard-check'
    case 'processing':
      return 'lucide:chef-hat'
    case 'ready':
      return 'lucide:package-check'
    case 'delivered':
      return 'lucide:heart-handshake'
    case 'cancelled':
      return 'lucide:x-circle'
    default:
      return 'lucide:package'
  }
}

// Calcular progreso para la barra del stepper horizontal (desktop)
const progressPercentage = computed(() => {
  if (!order.value || order.value.is_cancelled) return 0
  const status = order.value.status
  switch (status) {
    case 'pending':
      return 12
    case 'processing':
      return 42
    case 'ready':
      return 72
    case 'delivered':
      return 100
    default:
      return 12
  }
})
</script>

<template>
  <div class="flex-1 w-full bg-[#F4F1E1]/40 pt-2.5 pb-4 sm:pt-4 sm:pb-6 px-3 sm:px-6 lg:px-8 flex flex-col justify-start">
    <div class="max-w-5xl mx-auto w-full space-y-3 sm:space-y-3.5">

      <!-- ==================== BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES ==================== -->
      <div class="flex items-center justify-between gap-2">
        <NuxtLink
          to="/perfil?tab=pedidos"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-xs font-bold text-[#4A5D23] hover:text-[#2A321B] border border-[#4A5D23]/15 shadow-soft-sm hover:shadow-md transition-all group"
        >
          <Icon name="lucide:arrow-left" class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Volver a Mis Pedidos</span>
        </NuxtLink>

        <button
          v-if="order"
          @click="copyTrackingUrl"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-xs font-bold text-stone-700 hover:text-[#2A321B] border border-[#4A5D23]/15 shadow-soft-sm hover:shadow-md transition-all cursor-pointer"
          :title="'Copiar enlace de seguimiento para compartir'"
        >
          <Icon :name="isCopied ? 'lucide:check' : 'lucide:share-2'" class="w-3.5 h-3.5 text-[#4A5D23]" />
          <span class="hidden xs:inline">{{ isCopied ? '¡Copiado!' : 'Compartir' }}</span>
        </button>
      </div>

      <!-- ==================== ESTADO DE CARGA ==================== -->
      <div v-if="pending" class="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-soft-sm border border-[#4A5D23]/15 space-y-3">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-3 border-[#4A5D23] border-t-transparent mb-1" />
        <h2 class="font-playfair font-bold text-lg text-[#2A321B]">Localizando tu pedido en taller...</h2>
        <p class="text-xs text-stone-600 max-w-sm mx-auto font-sans">
          Estamos sincronizando los tiempos de preparación y el estado de despacho de Dulce Fe.
        </p>
      </div>

      <!-- ==================== ESTADO DE ERROR / NO ENCONTRADO ==================== -->
      <div v-else-if="error || !order" class="bg-white rounded-3xl p-6 sm:p-10 shadow-soft-md border border-red-200 text-center space-y-3">
        <div class="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
          <Icon name="lucide:alert-triangle" class="w-7 h-7" />
        </div>
        <h1 class="text-xl sm:text-2xl font-playfair font-black text-[#2A321B]">Pedido No Encontrado</h1>
        <p class="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          El enlace de seguimiento no es válido o la orden ha expirado. Si acabas de registrar un pedido, puedes revisar tu historial en tu perfil o escribirnos directamente.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <NuxtLink
            to="/perfil?tab=pedidos"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4A5D23] text-white text-xs font-bold rounded-full hover:bg-[#2A321B] shadow-soft-sm hover:shadow-md transition-all"
          >
            <Icon name="lucide:shopping-bag" class="w-3.5 h-3.5" />
            <span>Ir a Mis Pedidos</span>
          </NuxtLink>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-full hover:bg-stone-200 transition-all"
          >
            <Icon name="lucide:home" class="w-3.5 h-3.5" />
            <span>Ir al Inicio</span>
          </NuxtLink>
        </div>
      </div>

      <!-- ==================== VISTA PRINCIPAL (GRID RESPONSIVO DE 1 SOLA PANTALLA) ==================== -->
      <div v-else class="space-y-3 sm:space-y-3.5">

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">

          <!-- COLUMNA IZQUIERDA: HERO DEL PEDIDO + STEPPER (lg:col-span-7) -->
          <div class="lg:col-span-7">

            <!-- TARJETA HERO: ESTADO Y STEPPER -->
            <div class="bg-white rounded-2xl sm:rounded-3xl shadow-soft-sm border border-[#4A5D23]/15 overflow-hidden">
              <!-- Barra decorativa superior botánica -->
              <div class="h-1.5 w-full bg-gradient-to-r from-[#4A5D23] via-[#6a8435] to-[#4A5D23]/30" />

              <div class="p-3.5 sm:p-5 space-y-3.5">
                <!-- Encabezado compacto: Saludo + Badge + Referencia -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#4A5D23]/10">
                  <div>
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-[10px] font-black uppercase tracking-wider text-stone-500 font-sans">
                        Seguimiento en Vivo
                      </span>
                      <span
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border shadow-2xs"
                        :class="getStatusBadgeClass(order.status)"
                      >
                        <span 
                          v-if="!order.is_cancelled && order.status !== 'delivered'" 
                          class="flex h-1.5 w-1.5 relative"
                        >
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                          <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600" />
                        </span>
                        <Icon :name="getStatusIcon(order.status)" class="w-3 h-3" />
                        <span>{{ getStatusLabel(order.status) }}</span>
                      </span>
                    </div>

                    <h1 class="text-xl sm:text-2xl font-playfair font-black text-[#2A321B]">
                      ¡Hola, {{ order.customer_first_name }}!
                    </h1>

                    <!-- Referencia con botón de copia rápida -->
                    <div class="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5">
                      <span>Referencia:</span>
                      <button
                        @click="copyShortId"
                        type="button"
                        class="inline-flex items-center gap-1 font-mono font-bold text-[#4A5D23] bg-[#F4F1E1]/80 hover:bg-[#F4F1E1] px-2 py-0.5 rounded-md border border-[#4A5D23]/20 transition-all cursor-pointer"
                        title="Clic para copiar referencia"
                      >
                        <span>{{ order.short_id }}</span>
                        <Icon name="lucide:copy" class="w-3 h-3 opacity-70" />
                      </button>
                    </div>
                  </div>

                  <!-- Fecha programada si existe -->
                  <div
                    v-if="order.delivery_date"
                    class="bg-[#F4F1E1]/70 rounded-xl px-3 py-1.5 border border-[#4A5D23]/15 self-start sm:self-auto sm:text-right shrink-0 text-xs"
                  >
                    <span class="text-[10px] font-bold text-[#4A5D23] uppercase block">Entrega</span>
                    <span class="font-bold text-[#2A321B] block font-serif">{{ order.delivery_date }}</span>
                    <span v-if="order.delivery_time" class="text-[10px] text-stone-600 font-sans block">
                      {{ order.delivery_time }}
                    </span>
                  </div>
                </div>

                <!-- Alerta de orden cancelada -->
                <div
                  v-if="order.is_cancelled"
                  class="bg-red-50 border border-red-200 text-red-900 rounded-xl p-2.5 flex items-start gap-2 text-xs"
                  role="alert"
                >
                  <Icon name="lucide:x-circle" class="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p class="font-bold">Este pedido se encuentra cancelado.</p>
                    <p class="text-stone-700">Comunícate con nuestro taller vía WhatsApp para resolver cualquier consulta.</p>
                  </div>
                </div>

                <!-- ==================== STEPPER OPERATIVO COMPACTO ==================== -->
                <div v-if="!order.is_cancelled" class="pt-1">
                  <!-- Barra horizontal de 4 pasos -->
                  <div class="relative pb-1">
                    <!-- Barra conectora de fondo -->
                    <div class="absolute top-4 left-6 right-6 h-1 bg-stone-200 rounded-full" aria-hidden="true" />
                    <!-- Barra de progreso activa coloreada -->
                    <div 
                      class="absolute top-4 left-6 h-1 bg-[#4A5D23] rounded-full transition-all duration-500" 
                      :style="{ width: `calc(${progressPercentage}% - 1.5rem)` }"
                      aria-hidden="true" 
                    />

                    <div class="grid grid-cols-4 gap-1.5 sm:gap-2 relative">
                      <div
                        v-for="(step, idx) in order.timeline"
                        :key="step.status"
                        class="flex flex-col items-center text-center space-y-1"
                      >
                        <!-- Círculo del paso con icono -->
                        <div
                          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all shadow-2xs"
                          :class="[
                            step.current
                              ? 'bg-[#4A5D23] text-white ring-3 ring-[#4A5D23]/25 scale-105'
                              : step.completed
                                ? 'bg-[#4A5D23] text-white'
                                : 'bg-stone-100 text-stone-400 border border-stone-300'
                          ]"
                        >
                          <Icon v-if="step.completed && !step.current" name="lucide:check" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <Icon v-else-if="step.icon" :name="step.icon" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span v-else>{{ idx + 1 }}</span>
                        </div>

                        <!-- Nombre del paso -->
                        <div class="max-w-[85px] sm:max-w-[120px]">
                          <p
                            class="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2"
                            :class="step.current || step.completed ? 'text-[#2A321B]' : 'text-stone-400'"
                          >
                            {{ step.label }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Caja descriptiva del estado actual (muy compacta) -->
                  <div 
                    v-if="order.timeline.find(s => s.current)" 
                    class="mt-2.5 p-2 sm:p-2.5 rounded-xl bg-[#F4F1E1]/60 border border-[#4A5D23]/15 flex items-center gap-2 text-xs text-[#2A321B]"
                  >
                    <Icon name="lucide:info" class="w-3.5 h-3.5 text-[#4A5D23] shrink-0" />
                    <p class="leading-snug text-stone-700 text-[11px] sm:text-xs">
                      <span class="font-bold text-[#4A5D23]">{{ order.timeline.find(s => s.current)?.label }}:</span>
                      {{ order.timeline.find(s => s.current)?.description }}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          <!-- COLUMNA DERECHA: DETALLE DEL PEDIDO Y TOTAL (lg:col-span-5) -->
          <div class="lg:col-span-5">
            <div class="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-soft-sm border border-[#4A5D23]/15 space-y-3">
              <!-- Título del detalle -->
              <div class="flex items-center justify-between pb-2 border-b border-[#4A5D23]/10">
                <h2 class="text-sm sm:text-base font-playfair font-black text-[#2A321B] flex items-center gap-1.5">
                  <Icon name="lucide:shopping-bag" class="w-4 h-4 text-[#4A5D23]" />
                  <span>Detalle del Pedido</span>
                </h2>
                <span class="text-[10px] sm:text-[11px] font-bold text-stone-500 bg-[#F4F1E1] px-2 py-0.5 rounded-full border border-[#4A5D23]/10">
                  {{ order.items.length }} {{ order.items.length === 1 ? 'producto' : 'productos' }}
                </span>
              </div>

              <!-- Lista de productos con miniaturas controladas estrictamente (CERO DESBORDAMIENTO) -->
              <div class="divide-y divide-stone-100 max-h-[260px] overflow-y-auto pr-1">
                <div
                  v-for="(item, idx) in order.items"
                  :key="idx"
                  class="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5"
                >
                  <!-- Miniatura fija + Nombre + Cantidad -->
                  <div class="flex items-center gap-2.5 min-w-0">
                    <!-- Contenedor rígido estricto de 44x44px con estilo inline y clases para blindar tamaño en mobile -->
                    <div 
                      class="rounded-xl ring-1 ring-[#4A5D23]/15 overflow-hidden bg-[#F4F1E1] shrink-0 aspect-square flex items-center justify-center"
                      style="width: 44px; height: 44px; min-width: 44px; max-width: 44px; min-height: 44px; max-height: 44px;"
                    >
                      <img
                        v-if="item.image_url"
                        :src="item.image_url"
                        :alt="item.name"
                        class="w-full h-full object-cover block aspect-square"
                        style="width: 100%; height: 100%; max-width: 44px; max-height: 44px;"
                        loading="lazy"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-[#4A5D23]/60 bg-[#EDE8D5]">
                        <Icon name="lucide:cake" class="w-5 h-5" />
                      </div>
                    </div>

                    <!-- Textos del producto -->
                    <div class="min-w-0">
                      <p class="text-xs sm:text-sm font-bold text-[#2A321B] truncate leading-tight">
                        {{ item.name }}
                      </p>
                      <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-stone-500">
                        <span class="font-bold text-[#4A5D23] bg-[#F4F1E1] px-1.5 py-0.2 rounded text-[10px]">
                          {{ item.quantity }}x
                        </span>
                        <span v-if="item.price_at_time">
                          S/ {{ Number(item.price_at_time).toFixed(2) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Subtotal por ítem -->
                  <div v-if="item.price_at_time" class="text-right shrink-0">
                    <span class="text-xs sm:text-sm font-bold font-inter text-[#2A321B]">
                      S/ {{ (Number(item.price_at_time) * item.quantity).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Resumen y Total Financiero -->
              <div class="pt-2.5 border-t border-[#4A5D23]/10 space-y-1 text-xs">
                <div class="flex items-center justify-between text-stone-600 text-[11px] sm:text-xs">
                  <span>Entrega:</span>
                  <span class="font-medium text-[#2A321B] text-right truncate max-w-[180px] sm:max-w-[220px]">
                    {{ order.address || (order.channel === 'whatsapp_chat' ? 'Por coordinar por WhatsApp' : 'Recojo / Entrega pactada') }}
                  </span>
                </div>

                <div v-if="order.total_amount" class="flex items-center justify-between pt-1.5 border-t border-dashed border-stone-200">
                  <span class="font-playfair font-black text-sm sm:text-base text-[#2A321B]">Total</span>
                  <span class="font-inter font-black text-base sm:text-lg text-[#2A321B]">
                    S/ {{ Number(order.total_amount).toFixed(2) }}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- ==================== TARJETA WHATSAPP: ACCIÓN DE SOPORTE ABAJO DEL TODO ==================== -->
        <div class="bg-gradient-to-br from-[#F4F1E1] via-white to-emerald-50/50 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border border-[#4A5D23]/20 shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div class="space-y-0.5 text-center sm:text-left min-w-0">
            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300/60">
              <Icon name="lucide:message-circle" class="w-3 h-3 text-emerald-600" />
              <span>Atención Directa</span>
            </div>
            <h3 class="text-xs sm:text-sm font-playfair font-black text-[#2A321B]">
              {{ order.channel === 'whatsapp_chat' && order.status === 'pending'
                ? '¿Aún no coordinas los detalles de tu pedido?'
                : '¿Tienes alguna duda sobre tu entrega?' }}
            </h3>
            <p class="text-[11px] text-stone-600 leading-snug">
              {{ order.channel === 'whatsapp_chat' && order.status === 'pending'
                ? 'Escríbenos para confirmar stock, horario y medio de pago.'
                : 'Estamos en línea en nuestro taller para ayudarte.' }}
            </p>
          </div>

          <!-- Botón de WhatsApp Responsive Compacto -->
          <a
            :href="whatsappSupportUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs rounded-full shadow-soft-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4 text-white" />
            <span>{{ order.channel === 'whatsapp_chat' && order.status === 'pending' ? 'Coordinar por WhatsApp' : 'Escribir por WhatsApp' }}</span>
          </a>
        </div>

      </div>

    </div>
  </div>
</template>
