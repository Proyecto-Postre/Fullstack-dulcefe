<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

interface FinancialOrder {
  id: string
  code: string | null
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  cost_snapshot: Record<string, unknown> | null
  total_cost_cents: number | null
  gross_margin_cents: number | null
  created_at: string
  customer_name: string | null
  customer_phone: string | null
}

const items = ref<FinancialOrder[]>([])
const total = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const isLoading = ref(false)

const dateFrom = ref<string>('')
const dateTo = ref<string>('')

async function fetchFinancial() {
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

    const res = await $fetch<{ success: boolean; data: { items: FinancialOrder[]; total: number; totalPages: number } }>(
      `/api/admin/audit/financial?${params.toString()}`
    )
    if (res.success && res.data) {
      items.value = res.data.items
      total.value = res.data.total
      totalPages.value = res.data.totalPages || 1
    }
  } catch (error) {
    console.error('Error cargando auditoría financiera:', error)
  } finally {
    isLoading.value = false
  }
}

watch([dateFrom, dateTo], () => {
  currentPage.value = 1
  fetchFinancial()
})

watch(currentPage, () => {
  fetchFinancial()
})

onMounted(() => {
  fetchFinancial()
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

// Métricas de resumen calculadas en la página actual
const summaryMetrics = computed(() => {
  let revenue = 0
  let cost = 0
  let margin = 0
  for (const it of items.value) {
    revenue += Number(it.total_amount || 0)
    cost += Number(it.total_cost_cents ? it.total_cost_cents / 100 : 0)
    margin += Number(it.gross_margin_cents ? it.gross_margin_cents / 100 : 0)
  }
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0
  return { revenue, cost, margin, marginPct }
})

function exportCsv() {
  if (!items.value.length) return
  const headers = ['Fecha', 'Codigo', 'Cliente', 'Telefono', 'Venta (S/)', 'Costo Insumos (S/)', 'Margen (S/)', '% Margen', 'Metodo Pago', 'Estado Pago', 'Estado Pedido']
  const rows = items.value.map(it => {
    const cost = it.total_cost_cents ? (it.total_cost_cents / 100).toFixed(2) : '0.00'
    const margin = it.gross_margin_cents ? (it.gross_margin_cents / 100).toFixed(2) : '0.00'
    const pct = it.total_amount > 0 && it.gross_margin_cents ? ((it.gross_margin_cents / (it.total_amount * 100)) * 100).toFixed(1) : '0.0'
    return [
      formatDate(it.created_at),
      it.code || it.id.slice(0, 8),
      `"${(it.customer_name || '').replace(/"/g, '""')}"`,
      it.customer_phone || '',
      it.total_amount,
      cost,
      margin,
      `${pct}%`,
      it.payment_method,
      it.payment_status,
      it.status
    ]
  })

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `auditoria_financiera_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Tarjetas de Métricas de Resumen -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-surface p-4 rounded-2xl border border-brand-primary/10 shadow-soft-sm flex flex-col gap-1">
        <span class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Ventas en Vista</span>
        <span class="text-lg font-black text-brand-secondary font-mono">S/ {{ summaryMetrics.revenue.toFixed(2) }}</span>
      </div>

      <div class="bg-surface p-4 rounded-2xl border border-brand-primary/10 shadow-soft-sm flex flex-col gap-1">
        <span class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Costo Real Insumos</span>
        <span class="text-lg font-black text-rose-700 font-mono">S/ {{ summaryMetrics.cost.toFixed(2) }}</span>
      </div>

      <div class="bg-surface p-4 rounded-2xl border border-brand-primary/10 shadow-soft-sm flex flex-col gap-1">
        <span class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Margen Bruto Total</span>
        <span class="text-lg font-black text-emerald-700 font-mono">S/ {{ summaryMetrics.margin.toFixed(2) }}</span>
      </div>

      <div class="bg-surface p-4 rounded-2xl border border-brand-primary/10 shadow-soft-sm flex flex-col gap-1">
        <span class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Margen Rentabilidad</span>
        <span class="text-lg font-black text-brand-primary font-mono">{{ summaryMetrics.marginPct.toFixed(1) }}%</span>
      </div>
    </div>

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
          @click="fetchFinancial"
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
        Cargando auditoría financiera de pedidos...
      </div>

      <div v-else-if="!items.length" class="p-12 text-center flex flex-col items-center justify-center gap-2">
        <div class="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center text-brand-primary/50">
          <Icon name="lucide:receipt" class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-brand-secondary">Sin órdenes con escandallo congelado</p>
        <p class="text-xs text-brand-secondary/60 max-w-sm">Los costos congelados (COGS) se registran automáticamente cuando los pedidos pasan al estado "en preparación" en cocina.</p>
      </div>

      <!-- Tabla Desktop -->
      <div v-else class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-brand-cream/50 border-b border-brand-primary/10 text-[10px] font-black text-brand-primary/70 uppercase tracking-wider">
              <th class="py-3 px-4">Fecha & Hora</th>
              <th class="py-3 px-4">Código / Pedido</th>
              <th class="py-3 px-4">Cliente</th>
              <th class="py-3 px-4 text-right">Venta (PVP)</th>
              <th class="py-3 px-4 text-right">Costo Insumos</th>
              <th class="py-3 px-4 text-right">Margen Bruto</th>
              <th class="py-3 px-4 text-center">% Rentabilidad</th>
              <th class="py-3 px-4">Pago & Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-primary/5 font-medium">
            <tr v-for="it in items" :key="it.id" class="hover:bg-brand-cream/30 transition-colors">
              <td class="py-3 px-4 text-brand-secondary/70 whitespace-nowrap">
                {{ formatDate(it.created_at) }}
              </td>
              <td class="py-3 px-4 font-bold font-mono text-xs text-brand-primary">
                {{ it.code || `#${it.id.slice(0, 8)}` }}
              </td>
              <td class="py-3 px-4 text-brand-secondary">
                {{ it.customer_name || 'Cliente Mostrador' }}
                <span class="text-[10px] text-brand-primary/60 block">{{ it.customer_phone || '' }}</span>
              </td>
              <td class="py-3 px-4 text-right font-mono font-bold text-brand-secondary whitespace-nowrap">
                S/ {{ Number(it.total_amount).toFixed(2) }}
              </td>
              <td class="py-3 px-4 text-right font-mono text-rose-700 whitespace-nowrap">
                S/ {{ it.total_cost_cents ? (it.total_cost_cents / 100).toFixed(2) : '0.00' }}
              </td>
              <td class="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                S/ {{ it.gross_margin_cents ? (it.gross_margin_cents / 100).toFixed(2) : '0.00' }}
              </td>
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {{ it.total_amount > 0 && it.gross_margin_cents ? ((it.gross_margin_cents / (it.total_amount * 100)) * 100).toFixed(1) : '0.0' }}%
                </span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <span class="text-[10px] font-semibold text-brand-secondary capitalize block">{{ it.payment_method }}</span>
                <span class="text-[9px] text-brand-primary/60 uppercase font-mono">{{ it.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas Mobile -->
      <div v-if="items.length" class="md:hidden divide-y divide-brand-primary/5">
        <div v-for="it in items" :key="it.id" class="p-4 flex flex-col gap-2 hover:bg-brand-cream/20">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-brand-primary">
              {{ it.code || `#${it.id.slice(0, 8)}` }}
            </span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
              {{ it.total_amount > 0 && it.gross_margin_cents ? ((it.gross_margin_cents / (it.total_amount * 100)) * 100).toFixed(1) : '0.0' }}%
            </span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-brand-secondary font-semibold">{{ it.customer_name || 'Cliente Mostrador' }}</span>
            <span class="font-mono font-black text-brand-secondary">S/ {{ Number(it.total_amount).toFixed(2) }}</span>
          </div>

          <div class="flex items-center justify-between text-[11px] bg-brand-cream/30 px-2.5 py-1 rounded-lg">
            <span class="text-rose-700">Costo: S/ {{ it.total_cost_cents ? (it.total_cost_cents / 100).toFixed(2) : '0.00' }}</span>
            <span class="font-bold text-emerald-700">Margen: S/ {{ it.gross_margin_cents ? (it.gross_margin_cents / 100).toFixed(2) : '0.00' }}</span>
          </div>
        </div>
      </div>

      <!-- Paginación Responsiva -->
      <div v-if="totalPages > 1" class="flex items-center justify-between p-3.5 sm:p-4 border-t border-brand-primary/10 bg-brand-cream/20">
        <span class="text-xs text-brand-primary/70 font-medium">
          Página {{ currentPage }} de {{ totalPages }} <span class="hidden sm:inline">({{ total }} órdenes auditadas)</span>
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
