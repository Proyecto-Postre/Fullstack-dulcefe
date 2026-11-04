<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { exportToExcel } from '~/utils/excelExport'

interface AuditEventItem {
  id: string
  action: string
  entity: string
  entity_id: string | null
  actor_id: string | null
  request_id: string | null
  result: string
  created_at: string
}

const items = ref<AuditEventItem[]>([])
const total = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const isLoading = ref(false)

// Filtros
const selectedEntity = ref<string>('all')
const selectedAction = ref<string>('all')
const dateFrom = ref<string>('')
const dateTo = ref<string>('')

async function fetchEvents() {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(currentPage.value))
    params.set('limit', '15')

    if (selectedEntity.value !== 'all') {
      params.set('entity', selectedEntity.value)
    }
    if (selectedAction.value !== 'all') {
      params.set('action', selectedAction.value)
    }
    if (dateFrom.value) {
      params.set('from', new Date(dateFrom.value).toISOString())
    }
    if (dateTo.value) {
      const toDate = new Date(dateTo.value)
      toDate.setHours(23, 59, 59, 999)
      params.set('to', toDate.toISOString())
    }

    const res = await $fetch<{ success: boolean; data: { items: AuditEventItem[]; total: number; totalPages: number } }>(
      `/api/admin/audit/events?${params.toString()}`
    )
    if (res.success && res.data) {
      items.value = res.data.items
      total.value = res.data.total
      totalPages.value = res.data.totalPages || 1
    }
  } catch (error) {
    console.error('Error cargando eventos:', error)
  } finally {
    isLoading.value = false
  }
}

watch([selectedEntity, selectedAction, dateFrom, dateTo], () => {
  currentPage.value = 1
  fetchEvents()
})

watch(currentPage, () => {
  fetchEvents()
})

onMounted(() => {
  fetchEvents()
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

function getEntityLabel(entity: string) {
  const map: Record<string, string> = {
    orders: 'Pedidos',
    products: 'Vitrina',
    raw_materials: 'Insumos',
    batch_recipes: 'Recetas / Tandas',
    categories: 'Categorías',
    payments: 'Pagos / Vouchers',
    upload: 'Archivos'
  }
  return map[entity] || entity
}

async function exportExcel() {
  if (!items.value.length) return
  await exportToExcel({
    filename: `bitacora_sistema_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Bitácora',
    title: 'Dulce Fe — Bitácora Inmutable de Operaciones del Sistema',
    columns: [
      { header: 'Fecha & Hora', key: 'date', width: 20 },
      { header: 'Entidad / Módulo', key: 'entity', width: 22 },
      { header: 'Acción Ejecutada', key: 'action', width: 24 },
      { header: 'ID Referencia', key: 'entityId', width: 24 },
      { header: 'Resultado', key: 'result', width: 14, alignment: { horizontal: 'center' } },
      { header: 'Correlation ID', key: 'requestId', width: 28 },
      { header: 'Actor ID', key: 'actorId', width: 28 }
    ],
    rows: items.value.map(it => ({
      date: formatDate(it.created_at),
      entity: getEntityLabel(it.entity),
      action: it.action,
      entityId: it.entity_id || 'N/A',
      result: it.result,
      requestId: it.request_id || 'N/A',
      actorId: it.actor_id || 'Sistema'
    }))
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Barra de Filtros Responsiva -->
    <div class="bg-surface p-4 sm:p-5 rounded-2xl border border-brand-primary/10 shadow-soft-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1">
        <!-- Entidad -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Entidad</label>
          <select 
            v-model="selectedEntity" 
            class="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-brand-cream/40 border border-brand-primary/20 text-brand-secondary focus:outline-hidden focus:border-brand-primary"
          >
            <option value="all">Todas las entidades</option>
            <option value="orders">Pedidos</option>
            <option value="products">Productos de Vitrina</option>
            <option value="raw_materials">Insumos y Almacén</option>
            <option value="batch_recipes">Recetas y Tandas</option>
            <option value="categories">Secciones del Menú</option>
            <option value="payments">Pagos y Vouchers</option>
          </select>
        </div>

        <!-- Acción -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Acción</label>
          <select 
            v-model="selectedAction" 
            class="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-brand-cream/40 border border-brand-primary/20 text-brand-secondary focus:outline-hidden focus:border-brand-primary"
          >
            <option value="all">Todas las acciones</option>
            <option value="order.status">Cambio Estado Pedido</option>
            <option value="order.create_admin">Pedido Creado Admin</option>
            <option value="payment.verified">Pago Verificado</option>
            <option value="payment.rejected">Pago Rechazado</option>
            <option value="product.write">Edición / Creación Producto</option>
            <option value="material.write">Edición / Creación Insumo</option>
            <option value="stock.adjust">Ajuste de Stock</option>
            <option value="batch_recipe.create">Tanda Creada</option>
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
          @click="fetchEvents"
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-primary/20 bg-brand-cream text-brand-primary text-xs font-bold hover:bg-brand-cream/80 transition-all cursor-pointer shadow-soft-sm"
          title="Actualizar datos"
        >
          <Icon name="lucide:refresh-cw" :class="['w-3.5 h-3.5', isLoading ? 'animate-spin' : '']" />
          <span class="hidden sm:inline">Refrescar</span>
        </button>

        <button
          @click="exportExcel"
          :disabled="!items.length"
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-soft-sm disabled:opacity-40 disabled:cursor-not-allowed"
          title="Exportar reporte en formato Excel (.xlsx)"
        >
          <Icon name="lucide:file-spreadsheet" class="w-3.5 h-3.5 text-emerald-700" />
          <span>Exportar XLSX</span>
        </button>
      </div>
    </div>

    <!-- Contenedor de Registros -->
    <div class="bg-surface rounded-2xl border border-brand-primary/10 shadow-soft-sm overflow-hidden">
      <div v-if="isLoading && !items.length" class="p-8 text-center text-brand-secondary/60 text-xs font-medium">
        Cargando bitácora de operaciones...
      </div>

      <div v-else-if="!items.length" class="p-12 text-center flex flex-col items-center justify-center gap-2">
        <div class="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center text-brand-primary/50">
          <Icon name="lucide:file-text" class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-brand-secondary">No hay eventos registrados</p>
        <p class="text-xs text-brand-secondary/60 max-w-sm">No se encontraron acciones registradas con los filtros seleccionados.</p>
      </div>

      <!-- Tabla Desktop -->
      <div v-else class="hidden md:block overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-brand-cream/50 border-b border-brand-primary/10 text-[10px] font-black text-brand-primary/70 uppercase tracking-wider">
              <th class="py-3 px-4">Fecha & Hora</th>
              <th class="py-3 px-4">Entidad</th>
              <th class="py-3 px-4">Acción</th>
              <th class="py-3 px-4">ID Referencia</th>
              <th class="py-3 px-4 text-center">Resultado</th>
              <th class="py-3 px-4 font-mono text-[10px]">Correlation ID</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-primary/5 font-medium">
            <tr v-for="it in items" :key="it.id" class="hover:bg-brand-cream/30 transition-colors">
              <td class="py-3 px-4 text-brand-secondary/70 whitespace-nowrap">
                {{ formatDate(it.created_at) }}
              </td>
              <td class="py-3 px-4 font-bold text-brand-secondary">
                <span class="px-2 py-0.5 rounded-md bg-brand-cream text-brand-primary text-[10px] font-semibold border border-brand-primary/10">
                  {{ getEntityLabel(it.entity) }}
                </span>
              </td>
              <td class="py-3 px-4 font-mono text-xs text-brand-secondary">
                {{ it.action }}
              </td>
              <td class="py-3 px-4 text-brand-secondary/80 font-mono text-[11px]">
                {{ it.entity_id || '-' }}
              </td>
              <td class="py-3 px-4 text-center">
                <span :class="['px-2 py-0.5 rounded-md text-[10px] font-bold border', it.result === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200']">
                  {{ it.result }}
                </span>
              </td>
              <td class="py-3 px-4 text-brand-secondary/50 font-mono text-[10px] truncate max-w-[120px]" :title="it.request_id || ''">
                {{ it.request_id || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas Mobile -->
      <div v-if="items.length" class="md:hidden divide-y divide-brand-primary/5">
        <div v-for="it in items" :key="it.id" class="p-4 flex flex-col gap-2 hover:bg-brand-cream/20">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-brand-primary uppercase">
              {{ getEntityLabel(it.entity) }}
            </span>
            <span :class="['px-2 py-0.5 rounded-md text-[9px] font-bold border', it.result === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200']">
              {{ it.result }}
            </span>
          </div>

          <div class="text-xs font-mono font-bold text-brand-secondary">
            {{ it.action }}
          </div>

          <div class="flex items-center justify-between text-[11px] text-brand-secondary/60">
            <span>{{ formatDate(it.created_at) }}</span>
            <span v-if="it.entity_id" class="font-mono text-[10px]">Ref: {{ it.entity_id.slice(0, 8) }}</span>
          </div>
        </div>
      </div>

      <!-- Paginación Responsiva -->
      <div v-if="totalPages > 1" class="flex items-center justify-between p-3.5 sm:p-4 border-t border-brand-primary/10 bg-brand-cream/20">
        <span class="text-xs text-brand-primary/70 font-medium">
          Página {{ currentPage }} de {{ totalPages }} <span class="hidden sm:inline">({{ total }} eventos)</span>
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
