<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  type KdsOrder,
  calculateDeliveryUrgency,
  sortKdsOrdersByUrgency,
  aggregateBatchBakingRequirements,
  type BatchIngredientSummary
} from '~/utils/kds'

definePageMeta({
  layout: false, // Pantalla completa dedicada para tablet de cocina/taller
  middleware: 'admin-only'
})

const orders = ref<KdsOrder[]>([])
const isLoading = ref<boolean>(true)
const isUpdating = ref<string | null>(null)
const errorMsg = ref<string | null>(null)
const showMiseEnPlaceModal = ref<boolean>(false)
const activeFilter = ref<'all' | 'pending' | 'processing' | 'ready'>('all')
const lastUpdated = ref<string>('')

const isAuthError = ref<boolean>(false)

let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (!pollTimer) {
    pollTimer = setInterval(fetchKdsOrders, 15000)
  }
}

async function fetchKdsOrders() {
  try {
    const res = await $fetch<{ success: boolean; data: KdsOrder[] }>('/api/admin/kds/orders')
    orders.value = res.data || []
    lastUpdated.value = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    errorMsg.value = null
    isAuthError.value = false
    startPolling()
  } catch (err: unknown) {
    const fetchErr = err as {
      statusCode?: number
      status?: number
      response?: { status?: number }
      data?: { error?: { message?: string } }
      message?: string
    }
    const statusCode = fetchErr.statusCode || fetchErr.status || fetchErr.response?.status
    if (statusCode === 401 || statusCode === 403) {
      isAuthError.value = true
      errorMsg.value = 'Sesión expirada o sin permisos de administrador.'
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    } else {
      errorMsg.value = fetchErr.data?.error?.message || fetchErr.message || 'Error al conectar con la cocina.'
    }
  } finally {
    isLoading.value = false
  }
}

const filteredOrders = computed(() => {
  let list = orders.value
  if (activeFilter.value !== 'all') {
    list = list.filter((o) => o.status === activeFilter.value)
  }
  return sortKdsOrdersByUrgency(list)
})

const batchIngredients = computed<BatchIngredientSummary[]>(() => {
  return aggregateBatchBakingRequirements(orders.value)
})

async function advanceOrderStatus(order: KdsOrder, nextStatus: 'processing' | 'ready' | 'completed') {
  isUpdating.value = order.id
  try {
    await $fetch(`/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      body: { status: nextStatus }
    })
    // Actualizar localmente inmediatamente
    if (nextStatus === 'completed') {
      orders.value = orders.value.filter((o) => o.id !== order.id)
    } else {
      order.status = nextStatus
    }
  } catch (err: unknown) {
    const patchErr = err as { data?: { error?: { message?: string } }; message?: string }
    alert(`Error: ${patchErr.data?.error?.message || patchErr.message || 'No se pudo actualizar la comanda'}`)
  } finally {
    isUpdating.value = null
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

onMounted(() => {
  fetchKdsOrders()
  pollTimer = setInterval(fetchKdsOrders, 15000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans select-none">
    <!-- Header KDS con controles grandes para dedos de cocina -->
    <header class="bg-stone-950 border-b border-stone-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/admin"
          class="flex items-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 rounded-xl font-bold text-sm transition"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
          <span>Salir</span>
        </NuxtLink>

        <div>
          <h1 class="text-xl lg:text-2xl font-black text-amber-400 tracking-wide flex items-center gap-2">
            <Icon name="lucide:chef-hat" class="w-7 h-7 text-amber-400" />
            KDS TALLER &bull; DULCE FÉ
          </h1>
          <p class="text-xs text-stone-400">
            Última sync: {{ lastUpdated || 'Cargando...' }} &bull; {{ orders.length }} comandas activas
          </p>
        </div>
      </div>

      <!-- Filtros táctiles por estado -->
      <div class="flex items-center bg-stone-900 border border-stone-800 p-1 rounded-2xl gap-1">
        <button
          type="button"
          @click="activeFilter = 'all'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer',
            activeFilter === 'all' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
          ]"
        >
          Todas ({{ orders.length }})
        </button>
        <button
          type="button"
          @click="activeFilter = 'pending'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer',
            activeFilter === 'pending' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
          ]"
        >
          Pendientes ({{ orders.filter(o => o.status === 'pending').length }})
        </button>
        <button
          type="button"
          @click="activeFilter = 'processing'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer',
            activeFilter === 'processing' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
          ]"
        >
          En Horno ({{ orders.filter(o => o.status === 'processing').length }})
        </button>
        <button
          type="button"
          @click="activeFilter = 'ready'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer',
            activeFilter === 'ready' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
          ]"
        >
          Listas ({{ orders.filter(o => o.status === 'ready').length }})
        </button>
      </div>

      <!-- Acciones globales: Batch Baking y Fullscreen -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="showMiseEnPlaceModal = true"
          class="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-black rounded-xl text-sm shadow transition cursor-pointer"
        >
          <Icon name="lucide:scale" class="w-5 h-5" />
          <span>Mise en Place / Lotes</span>
        </button>

        <button
          type="button"
          @click="fetchKdsOrders"
          :disabled="isLoading"
          class="p-2.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 rounded-xl transition cursor-pointer"
          title="Actualizar"
        >
          <Icon name="lucide:refresh-cw" :class="['w-5 h-5', isLoading ? 'animate-spin' : '']" />
        </button>

        <button
          type="button"
          @click="toggleFullscreen"
          class="p-2.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 rounded-xl transition cursor-pointer"
          title="Pantalla Completa"
        >
          <Icon name="lucide:maximize" class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Error Banner -->
    <div v-if="errorMsg" class="bg-red-900/80 border-b border-red-700 px-6 py-3 text-red-200 text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-300" />
        <span>{{ errorMsg }}</span>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          v-if="isAuthError"
          to="/login"
          class="px-3 py-1 bg-red-750 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
        >
          <Icon name="lucide:log-in" class="w-3.5 h-3.5" />
          <span>Iniciar Sesión</span>
        </NuxtLink>
        <button v-else @click="fetchKdsOrders" class="underline font-bold text-white cursor-pointer">
          Reintentar
        </button>
      </div>
    </div>

    <!-- Tablero de Comandas -->
    <main class="flex-1 p-6 overflow-y-auto">
      <div v-if="isLoading && orders.length === 0" class="flex flex-col items-center justify-center h-64 gap-4 text-stone-400">
        <Icon name="lucide:loader" class="w-10 h-10 animate-spin text-amber-400" />
        <p class="text-base font-semibold">Cargando comandas activas del taller...</p>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="flex flex-col items-center justify-center h-64 gap-3 text-stone-500">
        <Icon name="lucide:check-check" class="w-16 h-16 text-stone-600" />
        <p class="text-lg font-bold">¡Todo al día! No hay pedidos en esta sección.</p>
      </div>

      <!-- Cuadrícula de Comandas (Cards táctiles) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <article
          v-for="order in filteredOrders"
          :key="order.id"
          class="bg-stone-800/90 rounded-2xl border-2 overflow-hidden flex flex-col justify-between shadow-xl transition"
          :class="[
            calculateDeliveryUrgency(order.delivery_date, order.delivery_time).level === 'overdue'
              ? 'border-red-600 shadow-red-950/50 ring-2 ring-red-500/50'
              : calculateDeliveryUrgency(order.delivery_date, order.delivery_time).level === 'urgent'
                ? 'border-amber-500 shadow-amber-950/30'
                : 'border-stone-700 hover:border-stone-600'
          ]"
        >
          <!-- Cabecera de la comanda -->
          <div class="p-4 bg-stone-850 border-b border-stone-750">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-stone-900 text-stone-300 border border-stone-700">
                #{{ order.short_id }}
              </span>

              <!-- Badge de Urgencia -->
              <span
                :class="[
                  'text-xs px-2.5 py-1 rounded-md font-black border flex items-center gap-1',
                  calculateDeliveryUrgency(order.delivery_date, order.delivery_time).badgeClass
                ]"
              >
                <Icon name="lucide:clock" class="w-3.5 h-3.5" />
                {{ calculateDeliveryUrgency(order.delivery_date, order.delivery_time).badgeLabel }}
              </span>
            </div>

            <h2 class="text-base font-bold text-white truncate flex items-center gap-1.5">
              <Icon name="lucide:user" class="w-4 h-4 text-amber-400 shrink-0" />
              <span>{{ order.customer_name }}</span>
            </h2>

            <p class="text-xs text-stone-400 mt-1 flex items-center gap-1">
              <Icon name="lucide:calendar" class="w-3.5 h-3.5 text-stone-500" />
              Entrega: <strong class="text-stone-200">{{ order.delivery_date || 'Sin fecha' }} - {{ order.delivery_time || '18:00' }}</strong>
            </p>
          </div>

          <!-- Items y Recetas requeridas -->
          <div class="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
            <div
              v-for="item in order.items"
              :key="item.product_id"
              class="bg-stone-900/80 p-3 rounded-xl border border-stone-750"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="font-black text-amber-300 text-base">
                  {{ item.quantity }}x
                </span>
                <span class="flex-1 font-bold text-stone-100 text-sm">
                  {{ item.product_name }}
                </span>
              </div>

              <!-- Lista de insumos requeridos por ítem si existen -->
              <div v-if="item.recipe && item.recipe.length > 0" class="mt-2.5 pt-2 border-t border-stone-800 text-xs space-y-1">
                <p class="text-[10px] font-black tracking-wider uppercase text-stone-400">Receta / Insumos:</p>
                <div
                  v-for="ing in item.recipe"
                  :key="ing.material_id"
                  class="flex justify-between text-stone-300 pl-2"
                >
                  <span class="truncate">&bull; {{ ing.material_name }}</span>
                  <span class="font-mono text-amber-400 font-semibold shrink-0">
                    {{ (ing.quantity_used * item.quantity).toFixed(0) }} {{ ing.unit }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Notas de la comanda -->
            <div v-if="order.notes" class="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start gap-1.5">
              <Icon name="lucide:message-square" class="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span class="italic">{{ order.notes }}</span>
            </div>
          </div>

          <!-- Botonera de Avance Rápido (Touch 1-Tap) -->
          <div class="p-3 bg-stone-850 border-t border-stone-750 flex items-center gap-2">
            <!-- Si está PENDIENTE -> Pasar a PROCESSING (En Horno) -->
            <button
              v-if="order.status === 'pending'"
              type="button"
              :disabled="isUpdating === order.id"
              @click="advanceOrderStatus(order, 'processing')"
              class="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Icon name="lucide:flame" class="w-5 h-5" />
              <span>HORNEAR AHORA</span>
            </button>

            <!-- Si está PROCESSING -> Pasar a READY (Listo) -->
            <button
              v-else-if="order.status === 'processing'"
              type="button"
              :disabled="isUpdating === order.id"
              @click="advanceOrderStatus(order, 'ready')"
              class="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Icon name="lucide:package-check" class="w-5 h-5" />
              <span>MARCAR LISTO</span>
            </button>

            <!-- Si está READY -> Pasar a COMPLETED (Despachado) -->
            <button
              v-else-if="order.status === 'ready'"
              type="button"
              :disabled="isUpdating === order.id"
              @click="advanceOrderStatus(order, 'completed')"
              class="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Icon name="lucide:check-circle-2" class="w-5 h-5" />
              <span>ENTREGADO / CERRAR</span>
            </button>
          </div>
        </article>
      </div>
    </main>

    <!-- Modal de Mise en Place & Horneado por Lotes -->
    <div
      v-if="showMiseEnPlaceModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-stone-900 border border-stone-700 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-stone-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Icon name="lucide:scale" class="w-7 h-7" />
            </div>
            <div>
              <h3 class="text-xl font-black text-white">Mise en Place &bull; Horneado por Lotes</h3>
              <p class="text-xs text-stone-400">Total consolidado de insumos requeridos para pedidos en cola</p>
            </div>
          </div>
          <button
            type="button"
            @click="showMiseEnPlaceModal = false"
            class="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 transition cursor-pointer"
          >
            <Icon name="lucide:x" class="w-6 h-6" />
          </button>
        </div>

        <div v-if="batchIngredients.length === 0" class="py-8 text-center text-stone-500">
          <Icon name="lucide:box" class="w-12 h-12 mx-auto mb-2 text-stone-600" />
          <p class="text-sm">No hay recetas asignadas a las comandas activas pendientes o en horno.</p>
        </div>

        <div v-else class="max-h-96 overflow-y-auto space-y-2">
          <div
            v-for="mat in batchIngredients"
            :key="mat.material_id"
            class="flex items-center justify-between p-3.5 bg-stone-800/80 rounded-xl border border-stone-700"
          >
            <div class="flex items-center gap-3">
              <Icon name="lucide:wheat" class="w-5 h-5 text-amber-400" />
              <span class="font-bold text-stone-200 text-sm">{{ mat.material_name }}</span>
            </div>
            <span class="font-mono text-base font-black text-amber-400">
              {{ mat.total_quantity.toLocaleString('es-PE', { maximumFractionDigits: 2 }) }} {{ mat.unit }}
            </span>
          </div>
        </div>

        <div class="pt-2 flex justify-end">
          <button
            type="button"
            @click="showMiseEnPlaceModal = false"
            class="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
          >
            Cerrar Resumen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
