<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface KardexItem {
  id: string
  raw_material_id: number
  quantity_delta: number
  stock_before: number
  stock_after: number
  type: string
  reason: string | null
  order_id: string | null
  actor_id: string | null
  request_id: string | null
  created_at: string
  raw_materials?: {
    id: number
    name: string
    unit: string
    type: string
  } | null
}

interface RawMaterialOption {
  id: number
  name: string
  unit: string
}

const props = defineProps<{
  materials?: RawMaterialOption[]
}>()

const items = ref<KardexItem[]>([])
const total = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const isLoading = ref(false)

// Filtros
const selectedMaterial = ref<string>('all')
const selectedType = ref<string>('all')
const dateFrom = ref<string>('')
const dateTo = ref<string>('')

async function fetchKardex() {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(currentPage.value))
    params.set('limit', '15')

    if (selectedMaterial.value !== 'all') {
      params.set('materialId', selectedMaterial.value)
    }
    if (selectedType.value !== 'all') {
      params.set('type', selectedType.value)
    }
    if (dateFrom.value) {
      params.set('from', new Date(dateFrom.value).toISOString())
    }
    if (dateTo.value) {
      // Ajustar fin del día
      const toDate = new Date(dateTo.value)
      toDate.setHours(23, 59, 59, 999)
      params.set('to', toDate.toISOString())
    }

    const res = await $fetch<{ success: boolean; data: { items: KardexItem[]; total: number; totalPages: number } }>(
      `/api/admin/audit/kardex?${params.toString()}`
    )
    if (res.success && res.data) {
      items.value = res.data.items
      total.value = res.data.total
      totalPages.value = res.data.totalPages || 1
    }
  } catch (error) {
    console.error('Error cargando kárdex:', error)
  } finally {
    isLoading.value = false
  }
}

watch([selectedMaterial, selectedType, dateFrom, dateTo], () => {
  currentPage.value = 1
  fetchKardex()
})

watch(currentPage, () => {
  fetchKardex()
})

onMounted(() => {
  fetchKardex()
})

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'purchase':
      return { label: 'Compra / Ingreso', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    case 'production_usage':
      return { label: 'Consumo Taller', class: 'bg-blue-50 text-blue-800 border-blue-200' }
    case 'adjustment':
      return { label: 'Ajuste Manual', class: 'bg-amber-50 text-amber-800 border-amber-200' }
    case 'waste':
      return { label: 'Merma / Baja', class: 'bg-rose-50 text-rose-800 border-rose-200' }
    case 'reversal':
      return { label: 'Reversión Pedido', class: 'bg-purple-50 text-purple-800 border-purple-200' }
    default:
      return { label: type, class: 'bg-stone-50 text-stone-800 border-stone-200' }
  }
}

function exportCsv() {
  if (!items.value.length) return
  const headers = ['Fecha', 'Insumo', 'Unidad', 'Tipo', 'Variacion', 'Stock Anterior', 'Stock Final', 'Motivo', 'Orden']
  const rows = items.value.map(it => [
    formatDate(it.created_at),
    `"${it.raw_materials?.name || it.raw_material_id}"`,
    it.raw_materials?.unit || '',
    it.type,
    it.quantity_delta,
    it.stock_before,
    it.stock_after,
    `"${(it.reason || '').replace(/"/g, '""')}"`,
    it.order_id || ''
  ])

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kardex_dulcefe_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Barra de Filtros Responsiva -->
    <div class="bg-surface p-4 sm:p-5 rounded-2xl border border-brand-primary/10 shadow-soft-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1">
        <!-- Insumo -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Insumo</label>
          <select 
            v-model="selectedMaterial" 
            class="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-brand-cream/40 border border-brand-primary/20 text-brand-secondary focus:outline-hidden focus:border-brand-primary"
          >
            <option value="all">Todos los insumos</option>
            <option v-for="mat in props.materials" :key="mat.id" :value="String(mat.id)">
              {{ mat.name }} ({{ mat.unit }})
            </option>
          </select>
        </div>

        <!-- Tipo de Movimiento -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Tipo</label>
          <select 
            v-model="selectedType" 
            class="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-brand-cream/40 border border-brand-primary/20 text-brand-secondary focus:outline-hidden focus:border-brand-primary"
          >
            <option value="all">Todos los tipos</option>
            <option value="purchase">Compras / Ingresos</option>
            <option value="production_usage">Consumo en Taller</option>
            <option value="adjustment">Ajustes Manuales</option>
            <option value="waste">Mermas / Pérdidas</option>
            <option value="reversal">Reversiones de Pedido</option>
          </select>
        </div>

        <!-- Fecha Desde -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Desde</label>
          <input 
            v-model="dateFrom" 
            type="date" 
            class="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-brand-cream/40 border border-brand-primary/20 text-brand-secondary focus:outline-hidden focus:border-brand-primary"
          />
        </div>

        <!-- Fecha Hasta -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Hasta</label>
          <input 
            v-model="dateTo" 
            type="date" 
            class="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-brand-cream/40 border border-brand-primary/20 text-brand-secondary focus:outline-hidden focus:border-brand-primary"
          />
        </div>
      </div>

      <div class="flex items-end justify-end gap-2 pt-1 md:pt-0">
        <button
          @click="fetchKardex"
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-primary/20 bg-brand-cream text-brand-primary text-xs font-bold hover:bg-brand-cream/80 transition-all cursor-pointer shadow-soft-sm"
          title="Actualizar datos"
        >
          <Icon name="lucide:refresh-cw" :class="['w-3.5 h-3.5', isLoading ? 'animate-spin' : '']" />
          <span class="hidden sm:inline">Refrescar</span>
        </button>

        <button
          @click="exportCsv"
          :disabled="!items.length"
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-soft-sm disabled:opacity-40 disabled:cursor-not-allowed"
          title="Exportar a archivo CSV"
        >
          <Icon name="lucide:download" class="w-3.5 h-3.5" />
          <span>CSV</span>
        </button>
      </div>
    </div>

    <!-- Contenedor de Tabla Desktop / Cards Mobile -->
    <div class="bg-surface rounded-2xl border border-brand-primary/10 shadow-soft-sm overflow-hidden">
      <!-- Loading Skeleton / Estado Vacío -->
      <div v-if="isLoading && !items.length" class="p-8 text-center text-brand-secondary/60 text-xs font-medium">
        Cargando movimientos de inventario...
      </div>

      <div v-else-if="!items.length" class="p-12 text-center flex flex-col items-center justify-center gap-2">
        <div class="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center text-brand-primary/50">
          <Icon name="lucide:archive-x" class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-brand-secondary">No se encontraron movimientos</p>
        <p class="text-xs text-brand-secondary/60 max-w-sm">No existen registros de kárdex para los filtros o rango de fechas seleccionado.</p>
      </div>

      <!-- Tabla Desktop (>= md) -->
      <div v-else class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-brand-cream/50 border-b border-brand-primary/10 text-[10px] font-black text-brand-primary/70 uppercase tracking-wider">
              <th class="py-3 px-4">Fecha & Hora</th>
              <th class="py-3 px-4">Materia Prima</th>
              <th class="py-3 px-4">Tipo Movimiento</th>
              <th class="py-3 px-4 text-right">Variación</th>
              <th class="py-3 px-4 text-center">Stock Antes -> Después</th>
              <th class="py-3 px-4">Motivo / Detalle</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-primary/5 font-medium">
            <tr v-for="it in items" :key="it.id" class="hover:bg-brand-cream/30 transition-colors">
              <td class="py-3 px-4 text-brand-secondary/70 whitespace-nowrap">
                {{ formatDate(it.created_at) }}
              </td>
              <td class="py-3 px-4 font-bold text-brand-secondary">
                {{ it.raw_materials?.name || `Insumo #${it.raw_material_id}` }}
                <span class="text-[10px] text-brand-primary/60 font-semibold block">{{ it.raw_materials?.unit || '' }}</span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <span :class="['px-2.5 py-1 rounded-lg text-[10px] font-bold border', getTypeBadge(it.type).class]">
                  {{ getTypeBadge(it.type).label }}
                </span>
              </td>
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <span :class="['font-black text-xs font-mono', it.quantity_delta > 0 ? 'text-emerald-700' : it.quantity_delta < 0 ? 'text-rose-700' : 'text-stone-600']">
                  {{ it.quantity_delta > 0 ? '+' : '' }}{{ it.quantity_delta }} {{ it.raw_materials?.unit || '' }}
                </span>
              </td>
              <td class="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px] text-brand-secondary/80">
                <span class="text-brand-secondary/60">{{ it.stock_before }}</span>
                <span class="mx-1 text-brand-primary/40">-></span>
                <span class="font-bold text-brand-secondary">{{ it.stock_after }}</span>
              </td>
              <td class="py-3 px-4 text-brand-secondary/80 max-w-xs truncate" :title="it.reason || ''">
                {{ it.reason || (it.order_id ? `Orden ref: ${it.order_id.slice(0, 8)}` : 'Sin motivo registrado') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas Mobile (< md) -->
      <div v-if="items.length" class="md:hidden divide-y divide-brand-primary/5">
        <div v-for="it in items" :key="it.id" class="p-4 flex flex-col gap-2 hover:bg-brand-cream/20">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-brand-secondary">
              {{ it.raw_materials?.name || `Insumo #${it.raw_material_id}` }}
            </span>
            <span :class="['px-2 py-0.5 rounded-md text-[9px] font-bold border', getTypeBadge(it.type).class]">
              {{ getTypeBadge(it.type).label }}
            </span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-[10px] text-brand-secondary/60">{{ formatDate(it.created_at) }}</span>
            <span :class="['font-black font-mono text-xs', it.quantity_delta > 0 ? 'text-emerald-700' : it.quantity_delta < 0 ? 'text-rose-700' : 'text-stone-600']">
              {{ it.quantity_delta > 0 ? '+' : '' }}{{ it.quantity_delta }} {{ it.raw_materials?.unit || '' }}
            </span>
          </div>

          <div class="flex items-center justify-between text-[11px] bg-brand-cream/30 px-2.5 py-1 rounded-lg">
            <span class="text-brand-secondary/60">Stock: {{ it.stock_before }} -> <strong>{{ it.stock_after }}</strong></span>
            <span v-if="it.reason" class="text-[10px] text-brand-secondary/70 italic truncate max-w-[150px]">
              {{ it.reason }}
            </span>
          </div>
        </div>
      </div>

      <!-- Paginación Responsiva -->
      <div v-if="totalPages > 1" class="flex items-center justify-between p-3.5 sm:p-4 border-t border-brand-primary/10 bg-brand-cream/20">
        <span class="text-xs text-brand-primary/70 font-medium">
          Página {{ currentPage }} de {{ totalPages }} <span class="hidden sm:inline">({{ total }} movimientos)</span>
        </span>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <button
            @click="prevPage"
            :disabled="currentPage <= 1"
            type="button"
            class="px-3 py-1.5 rounded-lg border border-brand-primary/20 text-xs font-bold text-brand-secondary bg-surface hover:bg-brand-cream transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Anterior
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            type="button"
            class="px-3 py-1.5 rounded-lg border border-brand-primary/20 text-xs font-bold text-brand-secondary bg-surface hover:bg-brand-cream transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
