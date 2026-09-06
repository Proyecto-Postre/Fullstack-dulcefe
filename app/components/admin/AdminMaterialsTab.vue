<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RawMaterialRow, BaseUnit } from '~/types/inventory'
import { useAdminMaterials } from '~/composables/admin/useAdminMaterials'
import MaterialModal from './MaterialModal.vue'

const props = defineProps<{
  materials: { success: boolean; data: RawMaterialRow[] } | null | undefined
  pendingMaterials: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const newMaterial = ref<{
  name: string
  unit: BaseUnit | string
  purchase_price: number | string
  purchase_quantity: number | string
  stock: number | string
}>({ 
  name: '', 
  unit: 'g', 
  purchase_price: '', 
  purchase_quantity: '', 
  stock: '' 
})

const editingMaterialId = ref<number | string | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

// Local state for Optimistic UI
const localMaterials = ref<RawMaterialRow[]>([])

watch(() => props.materials?.data, (newData) => {
  if (newData) {
    localMaterials.value = [...newData]
  }
}, { immediate: true })

// Composable de gestión de insumos
const {
  searchQuery,
  isSearchFocused,
  currentPage,
  paginatedMaterials,
  searchSuggestions,
  totalPages,
  selectSuggestion,
  clearSearch,
  nextPage,
  prevPage,
  getMaterialIcon,
  calculateUnitCost
} = useAdminMaterials(localMaterials)

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(() => props.materials?.data?.length, () => {
  currentPage.value = 1
})

async function handleCreateMaterial(): Promise<void> {
  if (!newMaterial.value.name || !newMaterial.value.purchase_price || !newMaterial.value.purchase_quantity) {
    errorMessage.value = 'Completa el precio y la cantidad del paquete.'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const method = editingMaterialId.value ? 'PUT' : 'POST'
    const endpoint = editingMaterialId.value ? `/api/raw-materials/${editingMaterialId.value}` : '/api/raw-materials'

    await $fetch(endpoint, {
      method,
      body: {
        name: newMaterial.value.name,
        unit: newMaterial.value.unit,
        purchase_price: Number(newMaterial.value.purchase_price),
        purchase_quantity: Number(newMaterial.value.purchase_quantity),
        stock: Number(newMaterial.value.stock || 0)
      }
    })
    
    cancelEditMaterial()
    emit('refresh')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    errorMessage.value = fetchErr.data?.statusMessage || fetchErr.message || 'Error al guardar insumo.'
  } finally {
    isSubmitting.value = false
  }
}

function handleEditMaterial(item: RawMaterialRow): void {
  errorMessage.value = ''
  editingMaterialId.value = item.id
  newMaterial.value = { 
    name: item.name || '', 
    unit: (item.unit as BaseUnit) || 'g', 
    purchase_price: item.purchase_price ?? '', 
    purchase_quantity: item.purchase_quantity ?? '', 
    stock: item.stock ?? '' 
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEditMaterial(): void {
  editingMaterialId.value = null
  newMaterial.value = { name: '', unit: 'g', purchase_price: '', purchase_quantity: '', stock: '' }
  errorMessage.value = ''
}

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
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-[#4A5D23]/10 shadow-soft-sm">
      <div>
        <h2 class="text-2xl font-black font-playfair text-[#2A321B]">Almacén de Insumos</h2>
        <p class="text-xs text-[#4A5D23]/70 font-medium mt-0.5">Control de materias primas, costos de adquisición y stock físico</p>
      </div>
      <button
        @click="openNewMaterialModal"
        type="button"
        class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Nuevo Insumo</span>
      </button>
    </div>

    <!-- Search Bar with Suggestions -->
    <div class="relative w-full max-w-xl">
      <div class="relative">
        <Icon name="lucide:search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A5D23]/40" />
        <input 
          v-model="searchQuery"
          @focus="isSearchFocused = true"
          type="text" 
          placeholder="Buscar insumos por nombre o unidad..."
          class="w-full pl-10 pr-10 py-2.5 bg-white border border-[#4A5D23]/15 rounded-xl text-xs font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 focus:outline-none focus:border-[#4A5D23] transition-colors shadow-xs"
        />
        <button 
          v-if="searchQuery" 
          @click="clearSearch"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5D23]/40 hover:text-red-600 p-0.5 cursor-pointer"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Dropdown de sugerencias -->
      <div 
        v-if="isSearchFocused && searchSuggestions.length > 0 && searchQuery"
        class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#4A5D23]/15 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-[#4A5D23]/5"
      >
        <button
          v-for="sugg in searchSuggestions"
          :key="sugg.id"
          @click="selectSuggestion(sugg)"
          type="button"
          class="w-full text-left px-4 py-2 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1]/40 flex items-center justify-between cursor-pointer"
        >
          <span>{{ sugg.name }}</span>
          <span class="text-[10px] text-[#4A5D23]/60">{{ sugg.unit }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pendingMaterials" class="flex justify-center py-20">
      <Icon name="lucide:loader-2" class="w-8 h-8 text-[#4A5D23] animate-spin" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!localMaterials.length" class="text-center py-20 bg-white rounded-[2rem] border border-[#4A5D23]/10 p-8 shadow-soft-sm">
      <div class="w-16 h-16 rounded-full bg-[#F4F1E1] flex items-center justify-center mx-auto mb-4 text-[#4A5D23]">
        <Icon name="lucide:scale" class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold font-playfair text-[#2A321B] mb-1">Sin insumos registrados</h3>
      <p class="text-xs text-[#4A5D23]/70 max-w-sm mx-auto mb-6">Comienza registrando tus materias primas para calcular recetas y escandallos.</p>
      <button
        @click="openNewMaterialModal"
        type="button"
        class="px-5 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all"
      >
        Crear Primer Insumo
      </button>
    </div>

    <!-- Table Section -->
    <div v-else class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-soft-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#4A5D23]/10 bg-[#F4F1E1]/40">
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider">Insumo</th>
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Precio Compra</th>
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Cant. Paquete</th>
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Costo x Unidad</th>
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-center">Stock Actual</th>
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#4A5D23]/5">
            <tr 
              v-for="item in paginatedMaterials" 
              :key="item.id" 
              class="hover:bg-[#F4F1E1]/20 transition-colors group"
            >
              <!-- Insumo: Icono + Nombre -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#F4F1E1] border border-[#4A5D23]/10 flex items-center justify-center text-[#4A5D23] shrink-0">
                    <Icon :name="getMaterialIcon(item.name)" class="w-5 h-5" />
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-[#2A321B]">{{ item.name }}</h4>
                    <p class="text-[10px] text-[#4A5D23]/60 uppercase tracking-wider font-bold">Unidad: {{ item.unit }}</p>
                  </div>
                </div>
              </td>

              <!-- Precio de Compra -->
              <td class="py-4 px-6 text-right">
                <span class="font-bold text-sm text-[#2A321B] font-inter">
                  S/ {{ Number(item.purchase_price ?? 0).toFixed(2) }}
                </span>
              </td>

              <!-- Cantidad Paquete -->
              <td class="py-4 px-6 text-right">
                <span class="font-bold text-xs text-[#2A321B] font-inter">
                  {{ Number(item.purchase_quantity ?? 0).toLocaleString() }} {{ item.unit }}
                </span>
              </td>

              <!-- Costo x Unidad -->
              <td class="py-4 px-6 text-right">
                <span class="font-bold text-xs text-[#4A5D23] font-inter">
                  S/ {{ calculateUnitCost(item.purchase_price, item.purchase_quantity).toFixed(4) }} / {{ item.unit }}
                </span>
              </td>

              <!-- Stock Actual (con edición inline rápida) -->
              <td class="py-4 px-6 text-center">
                <div class="inline-flex items-center gap-1">
                  <input
                    :value="item.stock ?? 0"
                    @change="updateStockInline(item, $event)"
                    type="number"
                    step="any"
                    class="w-20 px-2 py-1 bg-[#F4F1E1]/40 border border-[#4A5D23]/20 rounded-lg text-xs font-bold text-center text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                    title="Editar stock físico"
                  />
                  <span class="text-[10px] font-bold text-[#4A5D23]/60">{{ item.unit }}</span>
                </div>
              </td>

              <!-- Acciones -->
              <td class="py-4 px-6 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <button
                    @click="openEditMaterial(item)"
                    type="button"
                    class="w-8 h-8 rounded-lg bg-[#F4F1E1]/60 text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                    title="Editar Insumo"
                  >
                    <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDeleteMaterial(item.id, item.name || '')"
                    type="button"
                    class="w-8 h-8 rounded-lg bg-red-50 text-status-danger hover:bg-status-danger hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                    title="Eliminar Insumo"
                  >
                    <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="flex items-center justify-between p-4 border-t border-[#4A5D23]/10 bg-[#F4F1E1]/20">
        <span class="text-xs text-[#4A5D23]/70 font-medium">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <div class="flex items-center gap-2">
          <button
            @click="prevPage"
            :disabled="currentPage <= 1"
            class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
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
