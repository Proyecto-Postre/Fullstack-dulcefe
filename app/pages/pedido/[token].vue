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
  <div class="min-h-screen bg-[#F4F1E1]/40 py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto space-y-5 sm:space-y-6">

      <!-- ==================== BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES ==================== -->
      <div class="flex items-center justify-between gap-3">
        <NuxtLink
          to="/perfil?tab=pedidos"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-xs sm:text-sm font-bold text-[#4A5D23] hover:text-[#2A321B] border border-[#4A5D23]/15 shadow-soft-sm hover:shadow-md transition-all group"
        >
          <Icon name="lucide:arrow-left" class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver a Mis Pedidos</span>
        </NuxtLink>

        <button
          v-if="order"
          @click="copyTrackingUrl"
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-xs font-bold text-stone-700 hover:text-[#2A321B] border border-[#4A5D23]/15 shadow-soft-sm hover:shadow-md transition-all cursor-pointer"
          :title="'Copiar enlace de seguimiento para compartir'"
        >
          <Icon :name="isCopied ? 'lucide:check' : 'lucide:share-2'" class="w-3.5 h-3.5 text-[#4A5D23]" />
          <span class="hidden xs:inline">{{ isCopied ? '¡Enlace copiado!' : 'Compartir' }}</span>
        </button>
      </div>

      <!-- ==================== ESTADO DE CARGA ==================== -->
      <div v-if="pending" class="bg-white rounded-3xl sm:rounded-[2rem] p-12 text-center shadow-soft-sm border border-[#4A5D23]/15 space-y-4">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4A5D23] border-t-transparent mb-2" />
        <h2 class="font-playfair font-bold text-xl text-[#2A321B]">Localizando tu pedido en taller...</h2>
        <p class="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto font-sans">
          Estamos sincronizando los tiempos de preparación y el estado de despacho de Dulce Fe.
        </p>
      </div>

      <!-- ==================== ESTADO DE ERROR / NO ENCONTRADO ==================== -->
      <div v-else-if="error || !order" class="bg-white rounded-3xl sm:rounded-[2rem] p-8 sm:p-12 shadow-soft-md border border-red-200 text-center space-y-4">
        <div class="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
          <Icon name="lucide:alert-triangle" class="w-8 h-8" />
        </div>
        <h1 class="text-2xl font-playfair font-black text-[#2A321B]">Pedido No Encontrado</h1>
        <p class="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          El enlace de seguimiento no es válido o la orden ha expirado. Si acabas de registrar un pedido, puedes revisar tu historial en tu perfil o escribirnos directamente.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <NuxtLink
            to="/perfil?tab=pedidos"
            class="inline-flex items-center gap-2 px-6 py-3 bg-[#4A5D23] text-white text-xs sm:text-sm font-bold rounded-full hover:bg-[#2A321B] shadow-soft-sm hover:shadow-md transition-all"
          >
            <Icon name="lucide:shopping-bag" class="w-4 h-4" />
            <span>Ir a Mis Pedidos</span>
          </NuxtLink>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 px-6 py-3 bg-stone-100 text-stone-700 text-xs sm:text-sm font-bold rounded-full hover:bg-stone-200 transition-all"
          >
            <Icon name="lucide:home" class="w-4 h-4" />
            <span>Ir al Inicio</span>
          </NuxtLink>
        </div>
      </div>

      <!-- ==================== VISTA PRINCIPAL DE SEGUIMIENTO ==================== -->
      <div v-else class="space-y-5 sm:space-y-6">

        <!-- TARJETA 1: HERO DE LA ORDEN Y ESTADO EN VIVO -->
        <div class="bg-white rounded-3xl sm:rounded-[2rem] shadow-soft-md border border-[#4A5D23]/15 overflow-hidden">
          <!-- Borde decorativo superior con acento botánico -->
          <div class="h-1.5 w-full bg-gradient-to-r from-[#4A5D23] via-[#6a8435] to-[#4A5D23]/30" />

          <div class="p-5 sm:p-8 space-y-6">
            <!-- Fila Superior: Badge + Referencia + Saludo -->
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#4A5D23]/10">
              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2.5">
                  <span class="text-[11px] font-black uppercase tracking-wider text-stone-500 font-sans">
                    Seguimiento en Vivo
                  </span>
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-2xs"
                    :class="getStatusBadgeClass(order.status)"
                  >
                    <span 
                      v-if="!order.is_cancelled && order.status !== 'delivered'" 
                      class="flex h-2 w-2 relative"
                    >
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                    </span>
                    <Icon :name="getStatusIcon(order.status)" class="w-3.5 h-3.5" />
                    <span>{{ getStatusLabel(order.status) }}</span>
                  </span>
                </div>

                <h1 class="text-2xl sm:text-3xl font-playfair font-black text-[#2A321B]">
                  ¡Hola, {{ order.customer_first_name }}!
                </h1>

                <!-- Referencia con botón de copia -->
                <div class="flex items-center gap-2 text-xs text-stone-600">
                  <span>Referencia oficial:</span>
                  <button
                    @click="copyShortId"
                    type="button"
                    class="inline-flex items-center gap-1 font-mono font-bold text-[#4A5D23] bg-[#F4F1E1]/80 hover:bg-[#F4F1E1] px-2 py-0.5 rounded-lg border border-[#4A5D23]/20 transition-all cursor-pointer"
                    title="Clic para copiar referencia"
                  >
                    <span>{{ order.short_id }}</span>
                    <Icon name="lucide:copy" class="w-3 h-3 opacity-70" />
                  </button>
                </div>
              </div>

              <!-- Tarjeta de Fecha/Hora Programada (si existe) -->
              <div
                v-if="order.delivery_date"
                class="bg-gradient-to-br from-[#F4F1E1] to-[#ebe5d3] rounded-2xl p-4 border border-[#4A5D23]/15 self-start sm:self-auto sm:text-right shrink-0"
              >
                <div class="flex items-center sm:justify-end gap-1.5 text-xs text-[#4A5D23] font-bold">
                  <Icon name="lucide:calendar" class="w-3.5 h-3.5" />
                  <span>Entrega Programada</span>
                </div>
                <p class="text-base sm:text-lg font-playfair font-bold text-[#2A321B] mt-0.5">
                  {{ order.delivery_date }}
                  <span v-if="order.delivery_time" class="block text-xs font-sans font-medium text-stone-600">
                    Horario: {{ order.delivery_time }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Alerta si la orden fue cancelada -->
            <div
              v-if="order.is_cancelled"
              class="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 flex items-start gap-3"
              role="alert"
            >
              <Icon name="lucide:x-circle" class="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div class="space-y-1 text-xs sm:text-sm">
                <p class="font-bold">Este pedido se encuentra cancelado.</p>
                <p class="text-stone-700">Para cualquier consulta, reprogramación o duda sobre el estado de tu orden, puedes comunicarte con nuestro taller pastelero vía WhatsApp.</p>
              </div>
            </div>

            <!-- ==================== LÍNEA DE TIEMPO / STEPPER ==================== -->
            <div v-if="!order.is_cancelled" class="pt-2">

              <!-- VERSIÓN DESKTOP (Horizontal en pantallas sm: y superiores) -->
              <div class="hidden sm:block">
                <div class="relative pb-4">
                  <!-- Barra conectora de fondo -->
                  <div class="absolute top-5 left-10 right-10 h-1 bg-stone-200 rounded-full" aria-hidden="true" />
                  <!-- Barra de progreso activa coloreada -->
                  <div 
                    class="absolute top-5 left-10 h-1 bg-[#4A5D23] rounded-full transition-all duration-700" 
                    :style="{ width: `calc(${progressPercentage}% - 2.5rem)` }"
                    aria-hidden="true" 
                  />

                  <div class="grid grid-cols-4 gap-4 relative">
                    <div
                      v-for="(step, idx) in order.timeline"
                      :key="step.status"
                      class="flex flex-col items-center text-center space-y-2.5"
                    >
                      <!-- Círculo del paso con icono -->
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all shadow-sm"
                        :class="[
                          step.current
                            ? 'bg-[#4A5D23] text-white ring-4 ring-[#4A5D23]/25 scale-110 shadow-soft-sm'
                            : step.completed
                              ? 'bg-[#4A5D23] text-white'
                              : 'bg-stone-100 text-stone-400 border border-stone-300/80'
                        ]"
                      >
                        <Icon v-if="step.completed && !step.current" name="lucide:check" class="w-5 h-5" />
                        <Icon v-else-if="step.icon" :name="step.icon" class="w-4 h-4" />
                        <span v-else>{{ idx + 1 }}</span>
                      </div>

                      <!-- Textos del paso -->
                      <div class="space-y-1 max-w-[170px]">
                        <p
                          class="text-xs sm:text-sm font-bold font-sans"
                          :class="step.current || step.completed ? 'text-[#2A321B]' : 'text-stone-400'"
                        >
                          {{ step.label }}
                        </p>
                        <p class="text-[11px] text-stone-500 leading-snug">
                          {{ step.description }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- VERSIÓN MÓVIL (Timeline vertical ergonómica y limpia) -->
              <div class="block sm:hidden space-y-0 relative pl-2">
                <div
                  v-for="(step, idx) in order.timeline"
                  :key="step.status"
                  class="flex items-start gap-3.5 relative pb-6 last:pb-0"
                >
                  <!-- Línea conectora vertical entre nodos -->
                  <div
                    v-if="idx < order.timeline.length - 1"
                    class="absolute left-[18px] top-9 bottom-0 w-0.5 transition-colors"
                    :class="step.completed ? 'bg-[#4A5D23]' : 'bg-stone-200'"
                  />

                  <!-- Icono circular del nodo -->
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 shadow-2xs transition-all"
                    :class="[
                      step.current
                        ? 'bg-[#4A5D23] text-white ring-4 ring-[#4A5D23]/20 shadow-soft-sm'
                        : step.completed
                          ? 'bg-[#4A5D23] text-white'
                          : 'bg-stone-100 text-stone-400 border border-stone-200'
                    ]"
                  >
                    <Icon v-if="step.completed && !step.current" name="lucide:check" class="w-4 h-4" />
                    <Icon v-else-if="step.icon" :name="step.icon" class="w-4 h-4" />
                    <span v-else>{{ idx + 1 }}</span>
                  </div>

                  <!-- Contenido textual del paso -->
                  <div class="space-y-0.5 pt-0.5 min-w-0">
                    <div class="flex items-center gap-2">
                      <p
                        class="text-xs sm:text-sm font-bold font-sans"
                        :class="step.current || step.completed ? 'text-[#2A321B]' : 'text-stone-400'"
                      >
                        {{ step.label }}
                      </p>
                      <span
                        v-if="step.current"
                        class="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80"
                      >
                        En curso
                      </span>
                    </div>
                    <p class="text-[11px] text-stone-600 leading-relaxed">
                      {{ step.description }}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- TARJETA 2: DETALLE DEL PEDIDO (PRODUCTOS, FOTOS Y MONTOS) -->
        <div class="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-soft-md border border-[#4A5D23]/15 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-[#4A5D23]/10">
            <h2 class="text-lg sm:text-xl font-playfair font-black text-[#2A321B] flex items-center gap-2">
              <Icon name="lucide:shopping-bag" class="w-5 h-5 text-[#4A5D23]" />
              <span>Detalle del Pedido</span>
            </h2>
            <span class="text-xs font-bold text-stone-500 bg-[#F4F1E1]/80 px-2.5 py-1 rounded-full border border-[#4A5D23]/10">
              {{ order.items.length }} {{ order.items.length === 1 ? 'producto' : 'productos' }}
            </span>
          </div>

          <!-- Lista de productos -->
          <div class="divide-y divide-stone-100">
            <div
              v-for="(item, idx) in order.items"
              :key="idx"
              class="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
            >
              <!-- Miniatura + Nombre + Cantidad -->
              <div class="flex items-center gap-3 min-w-0">
                <!-- Miniatura de imagen con fallback -->
                <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl ring-1 ring-[#4A5D23]/15 overflow-hidden bg-[#F4F1E1] shrink-0 shadow-2xs">
                  <img
                    v-if="item.image_url"
                    :src="item.image_url"
                    :alt="item.name"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-[#4A5D23]/60 bg-[#EDE8D5]">
                    <Icon name="lucide:cake" class="w-6 h-6" />
                  </div>
                </div>

                <!-- Textos del producto -->
                <div class="min-w-0">
                  <p class="text-xs sm:text-sm font-bold text-[#2A321B] truncate">
                    {{ item.name }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                    <span class="font-bold text-[#4A5D23] bg-[#F4F1E1] px-2 py-0.5 rounded-md text-[11px]">
                      {{ item.quantity }}x
                    </span>
                    <span v-if="item.price_at_time">
                      S/ {{ Number(item.price_at_time).toFixed(2) }} c/u
                    </span>
                  </div>
                </div>
              </div>

              <!-- Subtotal por ítem -->
              <div v-if="item.price_at_time" class="text-right shrink-0">
                <span class="text-xs sm:text-sm font-black font-inter text-[#2A321B]">
                  S/ {{ (Number(item.price_at_time) * item.quantity).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Desglose y Total Financiero -->
          <div class="pt-4 border-t border-[#4A5D23]/10 space-y-2 text-xs sm:text-sm">
            <div class="flex items-center justify-between text-stone-600">
              <span>Entrega / Dirección:</span>
              <span class="font-medium text-[#2A321B] text-right truncate max-w-[240px]">
                {{ order.address || (order.channel === 'whatsapp_chat' ? 'Por coordinar por WhatsApp' : 'Recojo / Entrega pactada') }}
              </span>
            </div>

            <div v-if="order.total_amount" class="flex items-center justify-between pt-2 border-t border-dashed border-stone-200">
              <span class="font-playfair font-black text-base sm:text-lg text-[#2A321B]">Total del Pedido</span>
              <span class="font-inter font-black text-xl sm:text-2xl text-[#2A321B]">
                S/ {{ Number(order.total_amount).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <!-- TARJETA 3: COORDINACIÓN POR WHATSAPP Y ATENCIÓN PERSONALIZADA -->
        <div class="bg-gradient-to-br from-[#F4F1E1] via-white to-[#ebe5d3]/70 rounded-3xl sm:rounded-[2rem] p-5 sm:p-7 border border-[#4A5D23]/20 shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-5">
          <div class="space-y-1.5 text-center sm:text-left">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-300/70">
              <Icon name="lucide:message-circle" class="w-3.5 h-3.5 text-emerald-600" />
              <span>Atención Directa</span>
            </div>
            <h3 class="text-base sm:text-lg font-playfair font-black text-[#2A321B]">
              {{ order.channel === 'whatsapp_chat' && order.status === 'pending'
                ? '¿Aún no coordinas los detalles de tu pedido?'
                : '¿Tienes alguna pregunta sobre tu pedido o entrega?' }}
            </h3>
            <p class="text-xs sm:text-sm text-stone-600 max-w-lg leading-relaxed">
              {{ order.channel === 'whatsapp_chat' && order.status === 'pending'
                ? 'Nuestro equipo está listo para confirmar tu pedido, horarios de entrega y el medio de pago por WhatsApp.'
                : 'Estamos en línea en nuestro taller para ayudarte con cualquier consulta adicional.' }}
            </p>
          </div>

          <!-- Botón de WhatsApp Responsive -->
          <a
            :href="whatsappSupportUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs sm:text-sm rounded-full shadow-soft-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Icon name="lucide:message-circle" class="w-5 h-5 text-white" />
            <span>{{ order.channel === 'whatsapp_chat' && order.status === 'pending' ? 'Coordinar por WhatsApp' : 'Escribir por WhatsApp' }}</span>
          </a>
        </div>

      </div>

    </div>
  </div>
</template>

