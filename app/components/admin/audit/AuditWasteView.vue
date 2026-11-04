<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface WasteItem {
  id: string
  recipe_yield_id: number
  pieces_count: number
  reason: string
  notes: string | null
  profile_id: string | null
  created_at: string
  recipe_yields?: {
    id: number
    name: string
    base_recipes?: {
      id: number
      name: string
      utilities_cost: number
      labor_cost: number
    } | null
  } | null
}

const items = ref<WasteItem[]>([])
const total = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const isLoading = ref(false)

const dateFrom = ref<string>('')
const dateTo = ref<string>('')

async function fetchWaste() {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(currentPage.value))
    params.set('limit', '15')

    if (dateFrom.value) {
      params.set('from', new Date(dateFrom.value).toISOString())
    }
    if (dateTo.value) {
      const toDate = new Date(dateTo.value)
      toDate.setHours(23, 59, 59, 999)
      params.set('to', toDate.toISOString())
    }

    const res = await $fetch<{ success: boolean; data: { items: WasteItem[]; total: number; totalPages: number } }>(
      `/api/admin/audit/waste?${params.toString()}`
    )
    if (res.success && res.data) {
      items.value = res.data.items
      total.value = res.data.total
      totalPages.value = res.data.totalPages || 1
    }
  } catch (error) {
    console.error('Error cargando mermas:', error)
  } finally {
    isLoading.value = false
  }
}

watch([dateFrom, dateTo], () => {
  currentPage.value = 1
  fetchWaste()
})

watch(currentPage, () => {
  fetchWaste()
})

onMounted(() => {
  fetchWaste()
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

function exportCsv() {
  if (!items.value.length) return
  const headers = ['Fecha', 'Tanda Maestra', 'Presentacion', 'Piezas Mermadas', 'Motivo', 'Notas']
  const rows = items.value.map(it => [
    formatDate(it.created_at),
    `"${it.recipe_yields?.base_recipes?.name || 'Receta'}"`,
    `"${it.recipe_yields?.name || it.recipe_yield_id}"`,
    it.pieces_count,
    `"${it.reason}"`,
    `"${(it.notes || '').replace(/"/g, '""')}"`
  ])

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mermas_taller_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Barra de Filtros -->
    <div class="bg-surface p-4 sm:p-5 rounded-2xl border border-brand-primary/10 shadow-soft-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 max-w-md">
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

      <div class="flex items-end justify-end gap-2 pt-1 sm:pt-0">
        <button
          @click="fetchWaste"
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
          title="Exportar a CSV"
        >
          <Icon name="lucide:download" class="w-3.5 h-3.5" />
          <span>CSV</span>
        </button>
      </div>
    </div>

    <!-- Contenedor de Registros -->
    <div class="bg-surface rounded-2xl border border-brand-primary/10 shadow-soft-sm overflow-hidden">
      <div v-if="isLoading && !items.length" class="p-8 text-center text-brand-secondary/60 text-xs font-medium">
        Cargando registro de mermas y desperdicios...
      </div>

      <div v-else-if="!items.length" class="p-12 text-center flex flex-col items-center justify-center gap-2">
        <div class="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center text-brand-primary/50">
          <Icon name="lucide:sparkles" class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-brand-secondary">Sin mermas registradas</p>
        <p class="text-xs text-brand-secondary/60 max-w-sm">No existen reportes de desperdicios de taller ni piezas descartadas en el periodo.</p>
      </div>

      <!-- Tabla Desktop -->
      <div v-else class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-brand-cream/50 border-b border-brand-primary/10 text-[10px] font-black text-brand-primary/70 uppercase tracking-wider">
              <th class="py-3 px-4">Fecha & Hora</th>
              <th class="py-3 px-4">Tanda / Receta</th>
              <th class="py-3 px-4">Presentación</th>
              <th class="py-3 px-4 text-center">Piezas Perdidas</th>
              <th class="py-3 px-4">Motivo Declarado</th>
              <th class="py-3 px-4">Notas / Observaciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-primary/5 font-medium">
            <tr v-for="it in items" :key="it.id" class="hover:bg-brand-cream/30 transition-colors">
              <td class="py-3 px-4 text-brand-secondary/70 whitespace-nowrap">
                {{ formatDate(it.created_at) }}
              </td>
              <td class="py-3 px-4 font-bold text-brand-secondary">
                {{ it.recipe_yields?.base_recipes?.name || 'Tanda Taller' }}
              </td>
              <td class="py-3 px-4 text-brand-secondary">
                <span class="px-2 py-0.5 rounded-md bg-brand-cream text-brand-primary text-[10px] font-semibold border border-brand-primary/10">
                  {{ it.recipe_yields?.name || `Yield #${it.recipe_yield_id}` }}
                </span>
              </td>
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-rose-50 text-rose-800 border border-rose-200">
                  -{{ it.pieces_count }} und
                </span>
              </td>
              <td class="py-3 px-4 text-brand-secondary font-semibold">
                {{ it.reason }}
              </td>
              <td class="py-3 px-4 text-brand-secondary/70 italic text-[11px] max-w-xs truncate" :title="it.notes || ''">
                {{ it.notes || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas Mobile -->
      <div v-if="items.length" class="md:hidden divide-y divide-brand-primary/5">
        <div v-for="it in items" :key="it.id" class="p-4 flex flex-col gap-2 hover:bg-brand-cream/20">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-brand-secondary">
              {{ it.recipe_yields?.base_recipes?.name || 'Tanda Taller' }}
            </span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-rose-50 text-rose-800 border border-rose-200">
              -{{ it.pieces_count }} und
            </span>
          </div>

          <div class="text-[11px] text-brand-primary font-semibold">
            {{ it.recipe_yields?.name || `Yield #${it.recipe_yield_id}` }} &bull; {{ it.reason }}
          </div>

          <div class="flex items-center justify-between text-[10px] text-brand-secondary/60">
            <span>{{ formatDate(it.created_at) }}</span>
            <span v-if="it.notes" class="italic truncate max-w-[180px]">{{ it.notes }}</span>
          </div>
        </div>
      </div>

      <!-- Paginación Responsiva -->
      <div v-if="totalPages > 1" class="flex items-center justify-between p-3.5 sm:p-4 border-t border-brand-primary/10 bg-brand-cream/20">
        <span class="text-xs text-brand-primary/70 font-medium">
          Página {{ currentPage }} de {{ totalPages }} <span class="hidden sm:inline">({{ total }} reportes)</span>
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
