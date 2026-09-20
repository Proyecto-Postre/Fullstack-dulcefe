<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { RawMaterialRow } from '~/types/inventory'
import { useAdminMaterials } from '~/composables/admin/useAdminMaterials'
import MaterialModal from './MaterialModal.vue'

const props = defineProps<{
  materials: { success: boolean; data: RawMaterialRow[] } | null | undefined
  pendingMaterials: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()


// Local state for Optimistic UI
const localMaterials = ref<RawMaterialRow[]>([])

watch(() => props.materials?.data, (newData) => {
  if (newData) {
    localMaterials.value = [...newData]
  }
}, { immediate: true })

// Paginación dinámica según la altura disponible en pantalla
const dynamicPageSize = ref<number>(7)

function updateDynamicMaterialsPerPage(): void {
  if (typeof window === 'undefined') return
  if (window.innerWidth < 768) {
    dynamicPageSize.value = 6
    return
  }
  // Altura disponible = window.innerHeight - header ERP, tarjeta de buscador, thead y pie de tabla (~340px de elementos fijos)
  const availableHeight = window.innerHeight - 340
  const rowHeight = 64
  // Restamos 1 elemento para que la barra de paginación tenga suficiente distancia del borde
  const calculated = Math.floor(availableHeight / rowHeight) - 1
  dynamicPageSize.value = Math.max(5, Math.min(calculated, 10))
}

onMounted(() => {
  updateDynamicMaterialsPerPage()
  window.addEventListener('resize', updateDynamicMaterialsPerPage)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateDynamicMaterialsPerPage)
  }
})

// Composable de gestión de insumos
const {
  searchQuery,
  isSearchFocused,
  currentPage,
  paginatedMaterials,
  filteredMaterials,
  searchSuggestions,
  totalPages,
  selectSuggestion,
  clearSearch,
  nextPage,
  prevPage,
  getMaterialIcon,
  calculateUnitCost
} = useAdminMaterials(localMaterials, dynamicPageSize)

function handleSearchBlur(): void {
  setTimeout(() => {
    isSearchFocused.value = false
  }, 150)
}

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(() => props.materials?.data?.length, () => {
  currentPage.value = 1
})


async function handleDeleteMaterial(id: number | string, name: string): Promise<void> {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del inventario de insumos?`)) return
  
  const numId = Number(id)
  const index = localMaterials.value.findIndex((m: RawMaterialRow) => m.id === numId)
  let deletedItem: RawMaterialRow | null = null
  if (index !== -1) {
    deletedItem = localMaterials.value[index] ?? null
    localMaterials.value.splice(index, 1)
  }

  try {
    await $fetch(`/api/raw-materials/${id}`, { method: 'DELETE' })
  } catch (err: unknown) {
    if (deletedItem && index !== -1) {
      localMaterials.value.splice(index, 0, deletedItem)
    }
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    alert('Error al eliminar: ' + (fetchErr.data?.statusMessage || fetchErr.message || 'Error desconocido'))
  }
}

const updatingStockId = ref<number | string | null>(null)

async function updateStockInline(item: RawMaterialRow, event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const newStock = Number(target.value)
  if (newStock === item.stock || isNaN(newStock)) return
  
  updatingStockId.value = item.id
  try {
    await $fetch(`/api/raw-materials/${item.id}`, {
      method: 'PUT',
      body: {
        name: item.name,
        unit: item.unit,
        purchase_price: item.purchase_price,
        purchase_quantity: item.purchase_quantity,
        stock: newStock
      }
    })
    emit('refresh')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    alert('Error al actualizar stock: ' + (fetchErr.data?.statusMessage || fetchErr.message || 'Error desconocido'))
    target.value = String(item.stock ?? 0)
  } finally {
    updatingStockId.value = null
  }
}

// Modal State
const showModal = ref(false)
const selectedMaterial = ref<RawMaterialRow | null>(null)

function openNewMaterialModal(): void {
  selectedMaterial.value = null
  showModal.value = true
}

function openEditMaterial(item: RawMaterialRow): void {
  selectedMaterial.value = item
  showModal.value = true
}
</script>
<template>
  <div class="space-y-3.5 sm:space-y-4">
    <!-- Header Section con Búsqueda y Acción integradas -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[2rem] border border-[#4A5D23]/10 shadow-soft-sm">
      <div class="shrink-0">
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-black font-playfair text-[#2A321B]">Almacén de Insumos</h2>
          <span v-if="localMaterials.length" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4A5D23]/10 text-[#4A5D23] border border-[#4A5D23]/15">
            {{ searchQuery ? `${filteredMaterials.length} de ${localMaterials.length} ${localMaterials.length === 1 ? 'insumo' : 'insumos'}` : `${localMaterials.length} ${localMaterials.length === 1 ? 'insumo' : 'insumos'}` }}
          </span>
        </div>
        <p class="text-xs text-[#4A5D23]/70 font-medium mt-0.5">Control de materias primas, costos de adquisición y stock físico</p>
      </div>

      <!-- Barra de herramientas compacta: Búsqueda focalizada + Botón Nuevo Insumo -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <!-- Search Bar with Suggestions -->
        <div class="relative w-full sm:w-64 md:w-72 lg:w-80">
          <div class="relative">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A5D23]/40" />
            <input 
              v-model="searchQuery"
              @focus="isSearchFocused = true"
              @blur="handleSearchBlur"
              type="text" 
              placeholder="Buscar insumos o unidad..."
              class="w-full pl-10 pr-10 py-2.5 bg-[#F4F1E1]/40 hover:bg-[#F4F1E1]/70 focus:bg-white border border-[#4A5D23]/15 rounded-xl text-xs font-bold text-[#2A321B] placeholder:text-[#4A5D23]/40 focus:outline-none focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/15 transition-all shadow-xs"
            />
            <Transition name="fade">
              <button 
                v-if="searchQuery" 
                @click="clearSearch" 
                type="button" 
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5D23]/40 hover:text-red-600 p-0.5 cursor-pointer transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <Icon name="lucide:x" class="w-3.5 h-3.5" />
              </button>
            </Transition>
          </div>

          <!-- Dropdown de sugerencias -->
          <Transition name="dropdown">
            <div 
              v-if="isSearchFocused && searchSuggestions.length > 0 && searchQuery"
              class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#4A5D23]/15 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-[#4A5D23]/5"
            >
              <button
                v-for="sugg in searchSuggestions"
                :key="sugg.id"
                @mousedown.prevent="selectSuggestion(sugg)"
                type="button"
                class="w-full text-left px-4 py-2 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1]/40 flex items-center justify-between cursor-pointer"
              >
                <span>{{ sugg.name }}</span>
                <span class="text-[10px] text-[#4A5D23]/60">{{ sugg.unit }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- Botón Nuevo Insumo -->
        <button
          @click="openNewMaterialModal"
          type="button"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>Nuevo Insumo</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pendingMaterials" class="flex justify-center py-20">
      <Icon name="lucide:loader-2" class="w-8 h-8 text-[#4A5D23] animate-spin" />
    </div>

    <!-- Empty State General (Sin insumos registrados) -->
    <div v-else-if="!localMaterials.length" class="text-center py-16 bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 p-6 sm:p-8 shadow-soft-sm">
      <div class="w-16 h-16 rounded-full bg-[#F4F1E1] flex items-center justify-center mx-auto mb-4 text-[#4A5D23]">
        <Icon name="lucide:scale" class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold font-playfair text-[#2A321B] mb-1">Sin insumos registrados</h3>
      <p class="text-xs text-[#4A5D23]/70 max-w-sm mx-auto mb-6">Comienza registrando tus materias primas para calcular recetas y escandallos.</p>
      <button
        @click="openNewMaterialModal"
        type="button"
        class="px-5 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all cursor-pointer shadow-sm"
      >
        Crear Primer Insumo
      </button>
    </div>

    <!-- Main Content: Mobile Cards (< md) & Desktop Table (>= md) -->
    <div v-else class="space-y-3 sm:space-y-4">
      <!-- Empty State para búsquedas sin resultados (Mobile & Desktop) -->
      <div 
        v-if="!paginatedMaterials.length"
        class="bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 shadow-soft-sm text-center py-12 px-4 text-[#4A5D23]/60"
      >
        <div class="w-12 h-12 rounded-full bg-[#F4F1E1] flex items-center justify-center mx-auto mb-2 text-[#4A5D23]">
          <Icon name="lucide:search-x" class="w-6 h-6" />
        </div>
        <p class="text-xs sm:text-sm font-bold text-[#2A321B]">No se encontraron insumos</p>
        <p class="text-[11px] sm:text-xs text-[#4A5D23]/60 mt-0.5">No hay materias primas que coincidan con "{{ searchQuery }}"</p>
        <button 
          v-if="searchQuery" 
          @click="clearSearch" 
          type="button" 
          class="mt-3 px-3.5 py-1.5 text-xs font-bold text-[#4A5D23] bg-[#F4F1E1] hover:bg-[#4A5D23] hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          Limpiar búsqueda
        </button>
      </div>

      <template v-else>
        <!-- Vista Móvil (< md): Mobile Cards Táctiles con Barra de Acciones Inferior -->
        <TransitionGroup
          name="material-card"
          tag="div"
          class="space-y-3 md:hidden relative"
        >
          <div
            v-for="item in paginatedMaterials"
            :key="item.id"
            class="bg-white rounded-2xl border border-[#4A5D23]/10 shadow-soft-sm overflow-hidden flex flex-col justify-between transition-all hover:border-[#4A5D23]/25"
          >
            <!-- Cabecera de la Tarjeta (Top Body) -->
            <div class="p-3.5 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <!-- Izquierda: Icono temático (44x44px) + Nombre + Unidad -->
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-11 h-11 rounded-xl bg-[#F4F1E1] border border-[#4A5D23]/10 flex items-center justify-center text-[#4A5D23] shrink-0">
                    <Icon :name="getMaterialIcon(item.name)" class="w-5 h-5" />
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-sm text-[#2A321B] truncate leading-snug">{{ item.name }}</h4>
                    <p class="text-[10px] text-[#4A5D23]/60 uppercase tracking-wider font-bold mt-0.5">Unidad: {{ item.unit }}</p>
                  </div>
                </div>

                <!-- Derecha: Costo Unitario Destacado -->
                <div class="text-right shrink-0">
                  <p class="text-[10px] font-bold text-[#4A5D23]/70 uppercase tracking-wider">Costo / {{ item.unit }}</p>
                  <p class="font-black text-sm text-[#4A5D23] font-inter">
                    S/ {{ calculateUnitCost(item.purchase_price, item.purchase_quantity).toFixed(4) }}
                  </p>
                </div>
              </div>

              <!-- Fila Secundaria: Precios y Stock Físico editable -->
              <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#4A5D23]/10">
                <div>
                  <p class="text-[10px] text-[#4A5D23]/70 font-medium">Compra / Paquete</p>
                  <p class="text-xs font-bold text-[#2A321B]">
                    S/ {{ Number(item.purchase_price ?? 0).toFixed(2) }} <span class="text-[10px] font-normal text-[#4A5D23]/60">({{ Number(item.purchase_quantity ?? 0).toLocaleString() }} {{ item.unit }})</span>
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] text-[#4A5D23]/70 font-medium">Stock Físico</p>
                  <div class="inline-flex items-center gap-1 justify-end">
                    <input
                      :value="item.stock ?? 0"
                      @change="updateStockInline(item, $event)"
                      type="number"
                      step="any"
                      class="w-16 px-1.5 py-0.5 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-md text-xs font-bold text-center text-[#2A321B] focus:outline-none focus:bg-white focus:border-[#4A5D23]"
                      :aria-label="`Editar stock de ${item.name}`"
                    />
                    <span class="text-[10px] font-bold text-[#4A5D23]/60">{{ item.unit }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pie de la Tarjeta: Barra de Acciones para el Pulgar -->
            <div class="border-t border-[#4A5D23]/10 bg-[#F4F1E1]/30 grid grid-cols-2 divide-x divide-[#4A5D23]/10">
              <!-- 1. Editar -->
              <button
                @click="openEditMaterial(item)"
                type="button"
                class="h-10 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] active:bg-[#4A5D23]/15 transition-colors cursor-pointer"
                :aria-label="`Editar insumo ${item.name}`"
              >
                <Icon name="lucide:pencil" class="w-3.5 h-3.5 text-[#4A5D23]" />
                <span>Editar</span>
              </button>

              <!-- 2. Eliminar -->
              <button
                @click="handleDeleteMaterial(item.id, item.name || '')"
                type="button"
                class="h-10 flex items-center justify-center gap-1.5 text-xs font-bold text-status-danger hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer"
                :aria-label="`Eliminar insumo ${item.name}`"
              >
                <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- Vista Escritorio (>= md): Tabla Completa -->
        <div class="hidden md:block bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 shadow-soft-sm overflow-hidden">
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#4A5D23]/10 bg-[#F4F1E1]/40">
                  <th class="py-3 px-5 sm:px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider">Insumo</th>
                  <th class="py-3 px-5 sm:px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Precio Compra</th>
                  <th class="py-3 px-5 sm:px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Cant. Paquete</th>
                  <th class="py-3 px-5 sm:px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Costo x Unidad</th>
                  <th class="py-3 px-5 sm:px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-center">Stock Actual</th>
                  <th class="py-3 px-5 sm:px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <TransitionGroup
                name="material-row"
                tag="tbody"
                class="divide-y divide-[#4A5D23]/5 relative"
              >
                <tr 
                  v-for="item in paginatedMaterials" 
                  :key="item.id" 
                  class="hover:bg-[#F4F1E1]/20 transition-colors group"
                >
                  <!-- Insumo: Icono + Nombre -->
                  <td class="py-2.5 sm:py-3 px-5 sm:px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F4F1E1] border border-[#4A5D23]/10 flex items-center justify-center text-[#4A5D23] shrink-0">
                        <Icon :name="getMaterialIcon(item.name)" class="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h4 class="font-bold text-xs sm:text-sm text-[#2A321B]">{{ item.name }}</h4>
                        <p class="text-[10px] text-[#4A5D23]/60 uppercase tracking-wider font-bold">Unidad: {{ item.unit }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- Precio de Compra -->
                  <td class="py-2.5 sm:py-3 px-5 sm:px-6 text-right">
                    <span class="font-bold text-xs sm:text-sm text-[#2A321B] font-inter">
                      S/ {{ Number(item.purchase_price ?? 0).toFixed(2) }}
                    </span>
                  </td>

                  <!-- Cantidad Paquete -->
                  <td class="py-2.5 sm:py-3 px-5 sm:px-6 text-right">
                    <span class="font-bold text-xs text-[#2A321B] font-inter">
                      {{ Number(item.purchase_quantity ?? 0).toLocaleString() }} {{ item.unit }}
                    </span>
                  </td>

                  <!-- Costo x Unidad -->
                  <td class="py-2.5 sm:py-3 px-5 sm:px-6 text-right">
                    <span class="font-bold text-xs text-[#4A5D23] font-inter">
                      S/ {{ calculateUnitCost(item.purchase_price, item.purchase_quantity).toFixed(4) }} / {{ item.unit }}
                    </span>
                  </td>

                  <!-- Stock Actual (con edición inline rápida) -->
                  <td class="py-2.5 sm:py-3 px-5 sm:px-6 text-center">
                    <div class="inline-flex items-center gap-1">
                      <input
                        :value="item.stock ?? 0"
                        @change="updateStockInline(item, $event)"
                        type="number"
                        step="any"
                        class="w-18 sm:w-20 px-2 py-1 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-lg text-xs font-bold text-center text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                        aria-label="Editar stock físico"
                      />
                      <span class="text-[10px] font-bold text-[#4A5D23]/60">{{ item.unit }}</span>
                    </div>
                  </td>

                  <!-- Acciones -->
                  <td class="py-2.5 sm:py-3 px-5 sm:px-6 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        @click="openEditMaterial(item)"
                        type="button"
                        class="w-8 h-8 rounded-lg bg-[#F4F1E1]/60 text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        aria-label="Editar Insumo"
                      >
                        <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click="handleDeleteMaterial(item.id, item.name || '')"
                        type="button"
                        class="w-8 h-8 rounded-lg bg-red-50 text-status-danger hover:bg-status-danger hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        aria-label="Eliminar Insumo"
                      >
                        <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </TransitionGroup>
            </table>
          </div>

          <!-- Pagination Footer de Tabla Desktop (después del 7mo elemento) -->
          <div v-if="totalPages > 1" class="flex items-center justify-between p-3.5 sm:p-4 border-t border-[#4A5D23]/10 bg-[#F4F1E1]/20">
            <span class="text-xs text-[#4A5D23]/70 font-medium">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            <div class="flex items-center gap-2">
              <button
                @click="prevPage"
                :disabled="currentPage <= 1"
                class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage >= totalPages"
                class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        <!-- Paginación Mobile (< md) (después del 7mo elemento) -->
        <div 
          v-if="totalPages > 1" 
          class="flex md:hidden items-center justify-between p-3.5 rounded-2xl bg-white border border-[#4A5D23]/10 shadow-soft-sm"
        >
          <span class="text-xs text-[#4A5D23]/70 font-medium">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevPage"
              :disabled="currentPage <= 1"
              type="button"
              class="px-3 py-1.5 rounded-xl border border-[#4A5D23]/20 bg-[#F4F1E1]/30 hover:bg-[#F4F1E1] text-xs font-bold text-[#2A321B] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              type="button"
              class="px-3 py-1.5 rounded-xl border border-[#4A5D23]/20 bg-[#F4F1E1]/30 hover:bg-[#F4F1E1] text-xs font-bold text-[#2A321B] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              aria-label="Página siguiente"
            >
              Siguiente
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal de Insumo -->
    <MaterialModal
      :show="showModal"
      :material-to-edit="selectedMaterial"
      @close="showModal = false"
      @saved="emit('refresh')"
    />
  </div>
</template>

<style scoped>
/* ==========================================================================
   Animaciones FLIP y Transiciones para Insumos (Desktop & Mobile)
   ========================================================================== */

/* 1. Deslizamiento suave FLIP de las filas de insumos en tabla (Desktop) */
.material-row-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.material-row-enter-active {
  transition: opacity 0.25s ease-out, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.material-row-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.material-row-leave-active {
  position: absolute;
  width: 100%;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.05s ease;
}

/* 2. Deslizamiento suave FLIP para Mobile Cards (Mobile) */
.material-card-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.material-card-enter-active {
  transition: opacity 0.25s ease-out, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.material-card-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.material-card-leave-active {
  position: absolute;
  width: 100%;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.05s ease;
}

/* Transiciones para el botón de limpiar búsqueda */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transición para el dropdown de sugerencias */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .material-row-move,
  .material-row-enter-active,
  .material-row-leave-active,
  .material-card-move,
  .material-card-enter-active,
  .material-card-leave-active,
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none !important;
    transform: none !important;
  }
}
</style>
