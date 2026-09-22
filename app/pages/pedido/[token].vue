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
const businessPhone = String(config.public?.whatsappNumber || '51998265700')

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

function fallbackCopyText(text: string): boolean {
  if (typeof document === 'undefined') return false
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.opacity = '0'
  textArea.style.pointerEvents = 'none'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch {
    document.body.removeChild(textArea)
    return false
  }
}

// Función para copiar el enlace de seguimiento al portapapeles
const isCopied = ref(false)
let trackingUrlTimeout: ReturnType<typeof setTimeout> | null = null

async function copyTrackingUrl() {
  if (typeof window === 'undefined' || isCopied.value) return
  let copied = false
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href)
      copied = true
    }
  } catch {
    // fallback
  }

  if (!copied) {
    copied = fallbackCopyText(window.location.href)
  }

  if (copied) {
    isCopied.value = true
    toast.success('¡Enlace de seguimiento copiado al portapapeles!', {
      id: 'copy-tracking-url',
      duration: 2500
    })
    if (trackingUrlTimeout) clearTimeout(trackingUrlTimeout)
    trackingUrlTimeout = setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } else {
    toast.error('No se pudo copiar el enlace. Puedes copiar la URL del navegador.', {
      id: 'copy-tracking-url-error'
    })
  }
}

// Función para copiar la referencia del pedido con animación in-place
const isShortIdCopied = ref(false)
let shortIdTimeout: ReturnType<typeof setTimeout> | null = null

async function copyShortId() {
  if (!order.value?.short_id || isShortIdCopied.value) return
  if (typeof window === 'undefined') return
  let copied = false
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(order.value.short_id)
      copied = true
    }
  } catch {
    // fallback
  }

  if (!copied) {
    copied = fallbackCopyText(order.value.short_id)
  }

  if (copied) {
    isShortIdCopied.value = true
    if (shortIdTimeout) clearTimeout(shortIdTimeout)
    shortIdTimeout = setTimeout(() => {
      isShortIdCopied.value = false
    }, 1400)
  }
}

function getPaymentStatusLabel(status?: string | null): string {
  switch (status) {
    case 'verified':
      return 'Pago Verificado'
    case 'pending_verification':
      return 'En Verificación'
    case 'rejected':
      return 'Pago Observado'
    case 'pending':
    default:
      return 'Pendiente de Pago'
  }
}

function getPaymentStatusBadgeClass(status?: string | null): string {
  switch (status) {
    case 'verified':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300'
    case 'pending_verification':
      return 'bg-amber-100 text-amber-900 border-amber-300'
    case 'rejected':
      return 'bg-red-100 text-red-900 border-red-300'
    case 'pending':
    default:
      return 'bg-stone-100 text-stone-700 border-stone-300'
  }
}

function getPaymentStatusIcon(status?: string | null): string {
  switch (status) {
    case 'verified':
      return 'lucide:check-circle'
    case 'pending_verification':
      return 'lucide:clock'
    case 'rejected':
      return 'lucide:alert-circle'
    case 'pending':
    default:
      return 'lucide:hourglass'
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-900 border-amber-300/70'
    case 'processing':
      return 'bg-blue-100 text-blue-900 border-blue-300/70'
    case 'ready':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300'
    case 'delivered':
      return 'bg-[#4A5D23] text-white border-[#4A5D23]'
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
  <div class="flex-1 w-full bg-gradient-to-b from-[#F4F1E1]/60 via-[#F4F1E1]/40 to-[#F4F1E1]/80 py-4 sm:py-6 md:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-start md:justify-center relative overflow-hidden">
    
    <!-- Luces Ambientales Cálidas & Elementos Botánicos para Pantallas Medianas y Grandes -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-0 hidden sm:block">
      <div class="absolute -top-28 -left-28 w-[32rem] h-[32rem] bg-gradient-to-br from-brand-accent/15 via-brand-accent/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-28 -right-28 w-[36rem] h-[36rem] bg-gradient-to-tl from-brand-primary/10 via-brand-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <Icon name="lucide:leaf" class="absolute top-[6%] left-[1.5%] w-60 h-60 text-brand-primary/[0.035] -rotate-12 pointer-events-none" />
      <Icon name="lucide:wheat" class="absolute bottom-[8%] right-[2%] w-64 h-64 text-brand-primary/[0.03] rotate-45 pointer-events-none" />
    </div>

    <div class="relative z-10 w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto my-auto space-y-4 sm:space-y-5 lg:space-y-6 transition-all duration-300">

      <!-- ==================== BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES ==================== -->
      <div class="flex items-center justify-between gap-2">
        <NuxtLink
          to="/perfil?tab=pedidos"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/95 hover:bg-white text-xs sm:text-sm font-bold text-[#4A5D23] hover:text-[#2A321B] border border-[#4A5D23]/15 shadow-soft-sm hover:shadow-md transition-all group cursor-pointer"
        >
          <Icon name="lucide:arrow-left" class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver a Mis Pedidos</span>
        </NuxtLink>

        <button
          v-if="order"
          @click="copyTrackingUrl"
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/95 hover:bg-white text-xs sm:text-sm font-bold border shadow-soft-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
          :class="isCopied ? 'border-emerald-500 text-emerald-900 bg-emerald-100 scale-105' : 'text-stone-700 hover:text-[#2A321B] border-[#4A5D23]/15'"
          :title="'Copiar enlace de seguimiento para compartir'"
        >
          <Icon :name="isCopied ? 'lucide:check' : 'lucide:share-2'" class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200" :class="isCopied ? 'text-emerald-700 scale-110' : 'text-[#4A5D23]'" />
          <span class="hidden xs:inline">{{ isCopied ? '¡Copiado!' : 'Compartir enlace' }}</span>
        </button>
      </div>

      <!-- ==================== ESTADO DE CARGA ==================== -->
      <div v-if="pending" class="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-soft-md border border-[#4A5D23]/15 space-y-3">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-3 border-[#4A5D23] border-t-transparent mb-1" />
        <h2 class="font-playfair font-bold text-lg sm:text-xl text-[#2A321B]">Localizando tu pedido en taller...</h2>
        <p class="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto font-sans">
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

      <!-- ==================== VISTA PRINCIPAL MODULAR (ARQUITECTURA DE TARJETAS 2.0) ==================== -->
      <div v-else class="space-y-4 sm:space-y-5 lg:space-y-6">

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-stretch">

          <!-- COLUMNA IZQUIERDA: HERO DEL PEDIDO + STEPPER EN VIVO (lg:col-span-7) -->
          <div class="lg:col-span-7 flex flex-col">
            <div class="bg-white rounded-2xl sm:rounded-3xl shadow-soft-sm hover:shadow-soft-md transition-shadow border border-[#4A5D23]/15 overflow-hidden flex-1 flex flex-col justify-between">
              <!-- Barra decorativa superior artesanal -->
              <div class="h-2 w-full bg-gradient-to-r from-[#4A5D23] via-[#6a8435] to-[#C5A059]" />

              <div class="p-5 sm:p-7 lg:p-8 space-y-5 sm:space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <!-- Encabezado: Saludo + Badge + Referencia -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#4A5D23]/10">
                    <div>
                      <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span class="text-[10px] sm:text-xs font-black uppercase tracking-wider text-stone-500 font-sans">
                          Seguimiento en Vivo
                        </span>
                        <span
                          class="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full border shadow-2xs"
                          :class="getStatusBadgeClass(order.status)"
                        >
                          <span 
                            v-if="!order.is_cancelled && order.status !== 'delivered'" 
                            class="flex h-1.5 w-1.5 relative"
                          >
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600" />
                          </span>
                          <Icon :name="getStatusIcon(order.status)" class="w-3.5 h-3.5" />
                          <span>{{ getStatusLabel(order.status) }}</span>
                        </span>
                      </div>

                      <h1 class="text-2xl sm:text-3xl font-playfair font-black text-[#2A321B]">
                        ¡Hola, {{ order.customer_first_name }}!
                      </h1>

                      <!-- Referencia con botón de copia rápida -->
                      <div class="flex items-center gap-2 text-xs sm:text-sm text-stone-600 mt-1.5">
                        <span>Referencia:</span>
                        <button
                          @click="copyShortId"
                          type="button"
                          class="inline-flex items-center gap-1.5 font-mono font-bold px-2.5 py-0.5 sm:py-1 rounded-md border transition-all duration-200 select-none cursor-pointer"
                          :class="[
                            isShortIdCopied
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-500 shadow-2xs'
                              : 'text-[#4A5D23] bg-[#F4F1E1]/80 hover:bg-[#F4F1E1] border-[#4A5D23]/25 hover:border-[#4A5D23]/40 active:scale-95'
                          ]"
                          :title="isShortIdCopied ? '¡Referencia copiada!' : 'Clic para copiar comanda'"
                        >
                          <Icon
                            :name="isShortIdCopied ? 'lucide:check' : 'lucide:copy'"
                            class="w-3.5 h-3.5 transition-transform duration-200"
                            :class="isShortIdCopied ? 'text-emerald-700 scale-110' : 'opacity-70'"
                          />
                          <span>{{ order.short_id }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- Fecha y hora programada si existe -->
                    <div
                      v-if="order.delivery_date"
                      class="bg-[#F4F1E1]/80 rounded-2xl px-4 py-2.5 border border-[#4A5D23]/15 self-start sm:self-auto sm:text-right shrink-0"
                    >
                      <span class="text-[10px] sm:text-xs font-bold text-[#4A5D23] uppercase block">Entrega Programada</span>
                      <span class="font-bold text-[#2A321B] block font-serif text-sm sm:text-base">{{ order.delivery_date }}</span>
                      <span v-if="order.delivery_time" class="text-xs text-stone-600 font-sans block">
                        {{ order.delivery_time }}
                      </span>
                    </div>
                  </div>

                  <!-- Alerta de orden cancelada -->
                  <div
                    v-if="order.is_cancelled"
                    class="mt-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl p-3.5 sm:p-4 flex items-start gap-2.5 text-xs sm:text-sm"
                    role="alert"
                  >
                    <Icon name="lucide:x-circle" class="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p class="font-bold">Este pedido se encuentra cancelado.</p>
                      <p class="text-stone-700">Comunícate con nuestro taller vía WhatsApp para resolver cualquier consulta.</p>
                    </div>
                  </div>

                  <!-- ==================== STEPPER OPERATIVO EN VIVO ==================== -->
                  <div v-if="!order.is_cancelled" class="pt-4 sm:pt-5">
                    <div class="relative pb-2">
                      <!-- Barra conectora de fondo -->
                      <div class="absolute top-4 sm:top-5 left-6 right-6 sm:left-8 sm:right-8 h-1.5 bg-stone-200 rounded-full" aria-hidden="true" />
                      <!-- Barra de progreso activa coloreada -->
                      <div 
                        class="absolute top-4 sm:top-5 left-6 sm:left-8 h-1.5 bg-[#4A5D23] rounded-full transition-all duration-500" 
                        :style="{ width: `calc(${progressPercentage}% - 1.5rem)` }"
                        aria-hidden="true" 
                      />

                      <div class="grid grid-cols-4 gap-1 sm:gap-2 relative">
                        <div
                          v-for="(step, idx) in order.timeline"
                          :key="step.status"
                          class="flex flex-col items-center text-center space-y-1.5"
                        >
                          <!-- Círculo del paso con icono -->
                          <div
                            class="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm z-10 transition-all shadow-2xs"
                            :class="[
                              step.current
                                ? 'bg-[#4A5D23] text-white ring-4 ring-[#4A5D23]/25 scale-105'
                                : step.completed
                                  ? 'bg-[#4A5D23] text-white'
                                  : 'bg-stone-100 text-stone-400 border border-stone-300'
                            ]"
                          >
                            <Icon v-if="step.completed && !step.current" name="lucide:check" class="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            <Icon v-else-if="step.icon" :name="step.icon" class="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            <span v-else>{{ idx + 1 }}</span>
                          </div>

                          <!-- Nombre del paso -->
                          <div class="max-w-[85px] sm:max-w-[130px]">
                            <p
                              class="text-[11px] sm:text-xs lg:text-sm font-bold leading-tight line-clamp-2"
                              :class="step.current || step.completed ? 'text-[#2A321B]' : 'text-stone-400'"
                            >
                              {{ step.label }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Caja descriptiva del estado actual -->
                <div 
                  v-if="!order.is_cancelled && order.timeline.find(s => s.current)" 
                  class="mt-4 p-4 sm:p-4.5 rounded-2xl bg-[#F4F1E1]/70 border border-[#4A5D23]/15 flex items-center gap-3 text-xs sm:text-sm text-[#2A321B]"
                >
                  <div class="w-9 h-9 rounded-xl bg-white text-[#4A5D23] flex items-center justify-center shrink-0 border border-[#4A5D23]/15 shadow-2xs">
                    <Icon name="lucide:info" class="w-5 h-5" />
                  </div>
                  <p class="leading-snug text-stone-700 text-xs sm:text-sm">
                    <span class="font-bold text-[#4A5D23]">{{ order.timeline.find(s => s.current)?.label }}:</span>
                    {{ order.timeline.find(s => s.current)?.description }}
                  </p>
                </div>

                <!-- Tarjeta de Estado e Información del Pago (Yape / Plin / Efectivo) -->
                <div 
                  v-if="order.payment_method" 
                  class="mt-4 p-4 sm:p-5 rounded-2xl bg-white border border-[#4A5D23]/15 shadow-2xs space-y-3"
                >
                  <div class="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-[#4A5D23]/10">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center font-bold shrink-0">
                        <Icon 
                          :name="order.payment_method === 'efectivo' ? 'lucide:banknote' : 'lucide:smartphone'" 
                          class="w-4 h-4" 
                        />
                      </div>
                      <span class="text-xs sm:text-sm font-bold text-[#2A321B]">
                        Método de Pago: 
                        <span class="text-[#4A5D23] font-black uppercase">{{ order.payment_method }}</span>
                      </span>
                    </div>

                    <!-- Badge de estado de pago -->
                    <span 
                      class="px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5"
                      :class="getPaymentStatusBadgeClass(order.payment_status)"
                    >
                      <Icon :name="getPaymentStatusIcon(order.payment_status)" class="w-3.5 h-3.5" />
                      {{ getPaymentStatusLabel(order.payment_status) }}
                    </span>
                  </div>

                  <!-- Detalles de Pago Yape / Plin -->
                  <div 
                    v-if="order.payment_method === 'yape' || order.payment_method === 'plin'" 
                    class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-600"
                  >
                    <div v-if="order.payment_reference" class="p-2.5 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10 flex flex-col justify-center">
                      <span class="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">N° de Operación</span>
                      <span class="font-mono font-bold text-[#2A321B] text-xs sm:text-sm mt-0.5">{{ order.payment_reference }}</span>
                    </div>
                    
                    <div v-if="order.payment_receipt_url" class="p-2.5 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10 flex flex-col justify-center">
                      <span class="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Comprobante</span>
                      <a 
                        :href="order.payment_receipt_url" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="text-[#4A5D23] hover:underline font-bold text-xs inline-flex items-center gap-1 mt-0.5"
                      >
                        <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
                        Ver voucher adjunto
                      </a>
                    </div>
                  </div>

                  <p v-if="order.payment_method === 'efectivo'" class="text-xs text-stone-600">
                    Pago a contraentrega en efectivo al momento de recibir tus postres.
                  </p>
                  <p v-else-if="order.payment_status === 'pending_verification'" class="text-[11px] sm:text-xs text-stone-500 italic">
                    Estamos validando tu comprobante con el taller/tesorería.
                  </p>
                  <p v-else-if="order.payment_status === 'verified'" class="text-[11px] sm:text-xs text-emerald-700 font-medium">
                    Pago 100% verificado y conforme.
                  </p>
                </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA: DETALLE DEL PEDIDO, GARANTÍA Y TOTAL (lg:col-span-5) -->
          <div class="lg:col-span-5 flex flex-col">
            <div class="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-8 shadow-soft-sm hover:shadow-soft-md transition-shadow border border-[#4A5D23]/15 flex-1 flex flex-col justify-between space-y-4">
              <div class="space-y-4">
                <!-- Título del detalle -->
                <div class="flex items-center justify-between pb-3.5 border-b border-[#4A5D23]/10">
                  <h2 class="text-base sm:text-lg font-playfair font-black text-[#2A321B] flex items-center gap-2">
                    <Icon name="lucide:shopping-bag" class="w-5 h-5 text-[#4A5D23]" />
                    <span>Detalle del Pedido</span>
                  </h2>
                  <span class="text-xs font-bold text-stone-600 bg-[#F4F1E1] px-3 py-1 rounded-full border border-[#4A5D23]/10">
                    {{ order.items.length }} {{ order.items.length === 1 ? 'producto' : 'productos' }}
                  </span>
                </div>

                <!-- Lista de productos -->
                <div class="divide-y divide-stone-100 max-h-[260px] sm:max-h-[300px] lg:max-h-[340px] overflow-y-auto pr-1">
                  <div
                    v-for="(item, idx) in order.items"
                    :key="idx"
                    class="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <!-- Miniatura + Nombre + Cantidad -->
                    <div class="flex items-center gap-3 min-w-0">
                      <div 
                        class="rounded-2xl ring-1 ring-[#4A5D23]/15 overflow-hidden bg-[#F4F1E1] shrink-0 aspect-square flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 shadow-2xs"
                      >
                        <img
                          v-if="item.image_url"
                          :src="item.image_url"
                          :alt="item.name"
                          class="w-full h-full object-cover block aspect-square"
                          loading="lazy"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center text-[#4A5D23]/60 bg-[#EDE8D5]">
                          <Icon name="lucide:cake" class="w-6 h-6" />
                        </div>
                      </div>

                      <div class="min-w-0">
                        <p class="text-xs sm:text-sm font-bold text-[#2A321B] truncate leading-tight">
                          {{ item.name }}
                        </p>
                        <div class="flex items-center gap-2 mt-1 text-xs text-stone-500">
                          <span class="font-bold text-[#4A5D23] bg-[#F4F1E1] px-2.5 py-0.5 rounded text-xs border border-[#4A5D23]/10">
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

                <!-- Sello de Elaboración Artesanal (Complementa y equilibra la altura) -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-[#F4F1E1]/70 border border-[#4A5D23]/15 flex items-start gap-2.5 text-xs text-stone-600">
                  <Icon name="lucide:sparkles" class="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <div>
                    <p class="font-bold text-[#2A321B]">Garantía Artesanal Dulce Fe</p>
                    <p class="text-[11px] sm:text-xs text-stone-600 leading-snug">
                      Elaborado fresco el mismo día con ingredientes de primera calidad para una textura y sabor inigualables.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Resumen y Total Financiero (anclado abajo) -->
              <div class="pt-4 border-t border-[#4A5D23]/15 space-y-2 mt-2">
                <div class="flex items-center justify-between text-stone-600 text-xs sm:text-sm">
                  <span class="flex items-center gap-1.5">
                    <Icon name="lucide:map-pin" class="w-4 h-4 text-[#4A5D23]" />
                    <span>Entrega:</span>
                  </span>
                  <span class="font-medium text-[#2A321B] text-right truncate max-w-[190px] sm:max-w-[250px]">
                    {{ order.address || (order.channel === 'whatsapp_chat' ? 'Por coordinar por WhatsApp' : 'Recojo / Entrega pactada') }}
                  </span>
                </div>

                <div v-if="order.total_amount" class="flex items-center justify-between pt-2.5 border-t border-dashed border-stone-200">
                  <span class="font-playfair font-black text-base sm:text-lg text-[#2A321B]">Total</span>
                  <span class="font-inter font-black text-lg sm:text-xl text-[#2A321B]">
                    S/ {{ Number(order.total_amount).toFixed(2) }}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- ==================== TARJETA INDEPENDIENTE DE WHATSAPP: ACCIÓN DE SOPORTE ==================== -->
        <div class="bg-gradient-to-r from-[#F4F1E1]/90 via-white to-[#F4F1E1]/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 border border-[#4A5D23]/20 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="space-y-1 text-center sm:text-left min-w-0">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-bold border border-emerald-300 shadow-2xs">
              <Icon name="lucide:message-circle" class="w-3.5 h-3.5 text-emerald-700" />
              <span>Atención Directa de Taller</span>
            </div>
            <h3 class="text-base sm:text-lg lg:text-xl font-playfair font-black text-[#2A321B]">
              {{ order.channel === 'whatsapp_chat' && order.status === 'pending'
                ? '¿Aún no coordinas los detalles de tu pedido?'
                : '¿Tienes alguna duda sobre tu entrega?' }}
            </h3>
            <p class="text-xs sm:text-sm text-stone-600 leading-snug">
              {{ order.channel === 'whatsapp_chat' && order.status === 'pending'
                ? 'Escríbenos para confirmar stock, horario y medio de pago.'
                : 'Estamos en línea en nuestro taller para ayudarte.' }}
            </p>
          </div>

          <!-- Botón de WhatsApp Responsive -->
          <a
            :href="whatsappSupportUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 lg:px-8 lg:py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs sm:text-sm rounded-full shadow-soft-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span>{{ order.channel === 'whatsapp_chat' && order.status === 'pending' ? 'Coordinar por WhatsApp' : 'Escribir por WhatsApp' }}</span>
          </a>
        </div>

      </div>

    </div>
  </div>
</template>
