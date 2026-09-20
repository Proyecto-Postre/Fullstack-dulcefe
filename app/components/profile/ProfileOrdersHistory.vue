<script setup lang="ts">
import { computed } from 'vue'
import type { ProfileOrder } from '~/types/profile'

const props = defineProps<{
  orders: ProfileOrder[]
  isLoading: boolean
  formatDate: (dateStr: string) => string
  getStatusBadge: (status: string | null) => string
  getStatusLabel: (status: string | null) => string
  getStatusIcon?: (status: string | null) => string
  isOrderActive?: (status: string | null) => boolean
}>()

defineEmits<{
  (e: 'repeatOrder', order: ProfileOrder): void
}>()

// Separar pedidos activos (en camino / en preparación) de pedidos completados/cancelados
const activeOrders = computed(() => {
  if (!props.orders) return []
  return props.orders.filter(order => {
    if (props.isOrderActive) return props.isOrderActive(order.status)
    return order.status === 'pending' || order.status === 'processing' || order.status === 'preparing' || order.status === 'in_delivery'
  })
})

const pastOrders = computed(() => {
  if (!props.orders) return []
  return props.orders.filter(order => {
    if (props.isOrderActive) return !props.isOrderActive(order.status)
    return order.status !== 'pending' && order.status !== 'processing' && order.status !== 'preparing' && order.status !== 'in_delivery'
  })
})

const getOrderTotalItems = (order: ProfileOrder): number => {
  if (!order.order_items || order.order_items.length === 0) return 1
  return order.order_items.reduce((total, item) => total + (item.quantity || 1), 0)
}

const getOrderPreviewText = (order: ProfileOrder): string => {
  if (!order.order_items || order.order_items.length === 0) return 'Detalles del pedido'
  const names = order.order_items
    .map(i => `${i.quantity || 1}x ${i.products?.name || 'Postre'}`)
    .slice(0, 2)
  const remaining = order.order_items.length - 2
  if (remaining > 0) {
    return `${names.join(', ')} y ${remaining} más...`
  }
  return names.join(', ')
}
</script>

<template>
  <div class="animate-pop space-y-6">
    <!-- Encabezado de la Sección con estadísticas rápidas -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-primary/10">
      <div>
        <h2 class="text-2xl font-playfair font-black text-brand-secondary tracking-tight">
          Mis Pedidos
        </h2>
        <p class="text-xs text-brand-primary font-medium mt-0.5">
          Revisa el estado de tus entregas y repite tus compras favoritas con un clic
        </p>
      </div>

      <div v-if="orders.length > 0" class="flex items-center gap-2 self-start sm:self-auto">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-cream/80 text-brand-secondary border border-brand-primary/15">
          <Icon name="lucide:shopping-bag" class="w-3.5 h-3.5 text-brand-primary" />
          {{ orders.length }} {{ orders.length === 1 ? 'pedido' : 'pedidos' }}
        </span>
        <span v-if="activeOrders.length > 0" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/60 animate-pulse">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          {{ activeOrders.length }} en curso
        </span>
      </div>
    </div>
    
    <!-- Estado de Carga -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 text-brand-primary space-y-3">
      <Icon name="lucide:loader-2" class="w-9 h-9 animate-spin text-brand-primary" />
      <span class="text-xs font-bold">Cargando tus pedidos...</span>
    </div>

    <!-- Estado Vacío -->
    <div 
      v-else-if="orders.length === 0" 
      class="text-center py-16 px-4 rounded-3xl bg-brand-cream/20 border border-dashed border-brand-primary/20"
    >
      <div class="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center mx-auto mb-4 text-brand-primary shadow-soft-sm">
        <Icon name="lucide:shopping-bag" class="w-8 h-8 opacity-40" />
      </div>
      <h3 class="font-playfair font-bold text-lg text-brand-secondary mb-1">Aún no has realizado pedidos</h3>
      <p class="text-xs text-brand-primary max-w-sm mx-auto mb-6 leading-relaxed">
        Explora nuestra carta artesanal con tortas, pasteles y bocaditos recién horneados con ingredientes selectos.
      </p>
      <NuxtLink 
        to="/menu" 
        class="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-white bg-brand-primary px-6 py-3 rounded-full hover:bg-brand-secondary shadow-soft-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Icon name="lucide:sparkles" class="w-4 h-4" />
        <span>Explorar Carta de Postres</span>
      </NuxtLink>
    </div>

    <!-- Lista de Pedidos -->
    <div v-else class="space-y-6">
      
      <!-- SECCIÓN: PEDIDOS EN CURSO (Si existen) -->
      <div v-if="activeOrders.length > 0" class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="flex h-2.5 w-2.5 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <h3 class="text-xs font-black uppercase tracking-wider text-amber-900">
            Pedidos en curso
          </h3>
        </div>

        <div class="space-y-3">
          <div 
            v-for="order in activeOrders" 
            :key="order.id"
            class="group bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border-2 border-amber-300/70 rounded-3xl p-4 sm:p-5 shadow-soft-sm hover:shadow-md transition-all duration-200"
          >
            <!-- Cabecera de la Card -->
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-200/60">
              <div class="flex items-center gap-2.5">
                <span class="font-black text-sm text-brand-secondary">
                  Pedido #{{ order.id.slice(0, 8) }}
                </span>
                <span :class="['inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs', getStatusBadge(order.status)]">
                  <Icon v-if="getStatusIcon" :name="getStatusIcon(order.status)" class="w-3.5 h-3.5" />
                  <span>{{ getStatusLabel(order.status) }}</span>
                </span>
              </div>

              <div class="text-xs font-medium text-brand-primary/80 flex items-center gap-1">
                <Icon name="lucide:clock" class="w-3.5 h-3.5 text-brand-primary" />
                <span>{{ formatDate(order.created_at) }}</span>
              </div>
            </div>

            <!-- Contenido: Miniaturas de Postres y Resumen -->
            <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <!-- Stack de avatares con imágenes de los postres -->
                <div class="flex -space-x-2 shrink-0 overflow-hidden py-1">
                  <template v-if="order.order_items && order.order_items.length > 0">
                    <div 
                      v-for="(item, idx) in order.order_items.slice(0, 3)" 
                      :key="idx"
                      class="inline-block w-11 h-11 rounded-xl ring-2 ring-white overflow-hidden bg-brand-cream shadow-2xs shrink-0"
                    >
                      <img 
                        v-if="item.products?.image_url" 
                        :src="item.products.image_url" 
                        :alt="item.products.name"
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-brand-primary/60 bg-[#EDE8D5]">
                        <Icon name="lucide:cake" class="w-5 h-5" />
                      </div>
                    </div>
                    <div 
                      v-if="order.order_items.length > 3" 
                      class="inline-flex w-11 h-11 rounded-xl ring-2 ring-white items-center justify-center bg-brand-primary text-white text-[11px] font-black shrink-0 shadow-2xs"
                    >
                      +{{ order.order_items.length - 3 }}
                    </div>
                  </template>
                  <div 
                    v-else 
                    class="w-11 h-11 rounded-xl bg-brand-cream flex items-center justify-center text-brand-primary/60"
                  >
                    <Icon name="lucide:package" class="w-5 h-5" />
                  </div>
                </div>

                <!-- Detalle textual de productos -->
                <div class="min-w-0">
                  <p class="text-xs sm:text-sm font-bold text-brand-secondary truncate">
                    {{ getOrderPreviewText(order) }}
                  </p>
                  <p class="text-[11px] text-brand-primary/70 mt-0.5">
                    {{ getOrderTotalItems(order) }} {{ getOrderTotalItems(order) === 1 ? 'producto' : 'productos' }}
                    <span v-if="order.delivery_time" class="hidden xs:inline">• Entrega: {{ order.delivery_time }}</span>
                    <span v-if="order.address" class="hidden sm:inline">• {{ order.address }}</span>
                  </p>
                </div>
              </div>

              <!-- Total del pedido -->
              <div class="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-200/40 shrink-0">
                <span class="text-[10px] uppercase font-bold tracking-wider text-brand-primary block">Total</span>
                <span class="text-lg sm:text-xl font-black font-inter text-brand-secondary">
                  S/ {{ Number(order.total_amount).toFixed(2) }}
                </span>
              </div>
            </div>

            <!-- Notas de entrega si existen -->
            <div v-if="order.notes" class="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900/90 flex items-center gap-1.5">
              <Icon name="lucide:sticky-note" class="w-3.5 h-3.5 shrink-0 text-amber-700" />
              <span class="font-medium truncate">Nota: {{ order.notes }}</span>
            </div>

            <!-- Barra de Acciones de Pedido en Curso: Ver cómo va mi pedido -->
            <div class="pt-3 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-xs font-bold text-amber-950">
                <span class="flex h-2 w-2 relative">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                </span>
                <span>Seguimiento en vivo en taller</span>
              </div>

              <NuxtLink
                v-if="order.tracking_token"
                :to="`/pedido/${order.tracking_token}`"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-white bg-brand-primary hover:bg-brand-secondary shadow-soft-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="lucide:truck" class="w-4 h-4" />
                <span>Ver cómo va mi pedido</span>
                <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 opacity-80" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN: HISTORIAL DE PEDIDOS ANTERIORES -->
      <div class="space-y-3">
        <h3 v-if="activeOrders.length > 0" class="text-xs font-black uppercase tracking-wider text-brand-primary/80 pt-2">
          Pedidos anteriores
        </h3>

        <div class="space-y-3">
          <div 
            v-for="order in pastOrders" 
            :key="order.id"
            class="group bg-surface hover:bg-brand-cream/40 border border-brand-primary/10 hover:border-brand-primary/30 rounded-3xl p-4 sm:p-5 shadow-soft-sm hover:shadow-md transition-all duration-200"
          >
            <!-- Cabecera de la Card -->
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-brand-primary/10">
              <div class="flex items-center gap-2.5">
                <span class="font-black text-sm text-brand-secondary">
                  Pedido #{{ order.id.slice(0, 8) }}
                </span>
                <span :class="['inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs', getStatusBadge(order.status)]">
                  <Icon v-if="getStatusIcon" :name="getStatusIcon(order.status)" class="w-3.5 h-3.5" />
                  <span>{{ getStatusLabel(order.status) }}</span>
                </span>
              </div>

              <div class="text-xs font-medium text-brand-primary/80 flex items-center gap-1">
                <Icon name="lucide:calendar" class="w-3.5 h-3.5 text-brand-primary" />
                <span>{{ formatDate(order.created_at) }}</span>
              </div>
            </div>

            <!-- Contenido: Miniaturas de Postres y Resumen -->
            <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <!-- Stack de miniaturas de postres -->
                <div class="flex -space-x-2 shrink-0 overflow-hidden py-1">
                  <template v-if="order.order_items && order.order_items.length > 0">
                    <div 
                      v-for="(item, idx) in order.order_items.slice(0, 3)" 
                      :key="idx"
                      class="inline-block w-11 h-11 rounded-xl ring-2 ring-surface overflow-hidden bg-brand-cream shadow-2xs shrink-0"
                    >
                      <img 
                        v-if="item.products?.image_url" 
                        :src="item.products.image_url" 
                        :alt="item.products.name"
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-brand-primary/60 bg-[#EDE8D5]">
                        <Icon name="lucide:cake" class="w-5 h-5" />
                      </div>
                    </div>
                    <div 
                      v-if="order.order_items.length > 3" 
                      class="inline-flex w-11 h-11 rounded-xl ring-2 ring-surface items-center justify-center bg-brand-primary text-white text-[11px] font-black shrink-0 shadow-2xs"
                    >
                      +{{ order.order_items.length - 3 }}
                    </div>
                  </template>
                  <div 
                    v-else 
                    class="w-11 h-11 rounded-xl bg-brand-cream flex items-center justify-center text-brand-primary/60"
                  >
                    <Icon name="lucide:package" class="w-5 h-5" />
                  </div>
                </div>

                <!-- Detalle textual de productos -->
                <div class="min-w-0">
                  <p class="text-xs sm:text-sm font-bold text-brand-secondary truncate">
                    {{ getOrderPreviewText(order) }}
                  </p>
                  <p class="text-[11px] text-brand-primary/70 mt-0.5">
                    {{ getOrderTotalItems(order) }} {{ getOrderTotalItems(order) === 1 ? 'producto' : 'productos' }}
                    <span v-if="order.address" class="hidden md:inline">• Entrega: {{ order.address }}</span>
                  </p>
                </div>
              </div>

              <!-- Total del pedido -->
              <div class="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-brand-primary/10 shrink-0">
                <span class="text-[10px] uppercase font-bold tracking-wider text-brand-primary block">Total</span>
                <span class="text-lg sm:text-xl font-black font-inter text-brand-secondary">
                  S/ {{ Number(order.total_amount).toFixed(2) }}
                </span>
              </div>
            </div>

            <!-- Barra de Acciones de la Card -->
            <div class="pt-3 border-t border-brand-primary/10 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="text-[11px] text-brand-primary/70 inline-flex items-center gap-1.5">
                  <Icon name="lucide:check" class="w-3.5 h-3.5 text-status-success" />
                  <span>Entrega confirmada</span>
                </span>

                <NuxtLink
                  v-if="order.tracking_token"
                  :to="`/pedido/${order.tracking_token}`"
                  class="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-secondary hover:underline transition-colors"
                >
                  <Icon name="lucide:receipt" class="w-3.5 h-3.5" />
                  <span>Ver seguimiento / detalle</span>
                </NuxtLink>
              </div>

              <!-- Botón Estrella de Repetir Pedido -->
              <button
                v-if="order.order_items && order.order_items.length > 0"
                @click="$emit('repeatOrder', order)"
                type="button"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-white bg-brand-primary hover:bg-brand-secondary shadow-soft-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="lucide:rotate-cw" class="w-4 h-4" />
                <span>Repetir Pedido</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
