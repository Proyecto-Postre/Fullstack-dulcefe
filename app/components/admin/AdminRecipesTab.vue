<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import type { ProductRow } from '~/types/catalog'
import type { RawMaterialRow } from '~/types/inventory'
import type { BaseRecipeDetail, ProductBatchComposition } from '~/types/batch-recipe'
import { useAdminRecipes } from '~/composables/admin/useAdminRecipes'
import { useAdminBatchRecipes } from '~/composables/admin/useAdminBatchRecipes'
import ProductModal from './ProductModal.vue'
import BatchRecipeModal from './BatchRecipeModal.vue'
import QuickPieceDeductionModal from './QuickPieceDeductionModal.vue'
import ProductBatchMappingModal from './ProductBatchMappingModal.vue'

const props = defineProps<{
  catalog: { success: boolean; data: ProductRow[] } | null | undefined
  materials: { success: boolean; data: RawMaterialRow[] } | null | undefined
  modelValue: ProductRow | null | undefined
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: ProductRow | null): void
  (e: 'refresh-catalog'): void
}>()

// Sub-pestaña activa: 'batches' (Tandas Maestras) o 'products' (Costeo de Productos)
const activeSubTab = ref<'batches' | 'products'>('batches')

// Buscador de tandas
const batchSearchQuery = ref('')

// Estado de modales
const showProductModal = ref(false)
const showBatchModal = ref(false)
const batchToEdit = ref<BaseRecipeDetail | null>(null)

const showQuickDeductionModal = ref(false)
const quickDeductionBatchId = ref<number | null>(null)

const showProductMappingModal = ref(false)
const activeProductComposition = ref<ProductBatchComposition | null>(null)
const isLoadingComposition = ref(false)

const isMobileAddSheetOpen = ref(false)
const isMobilePublishSheetOpen = ref(false)
const isCifExpandedMobile = ref(false)

// Composable de Tandas Maestras
const {
  batchRecipes,
  isLoading: isLoadingBatches,
  fetchBatchRecipes,
  deleteBatchRecipe,
  fetchProductComposition
} = useAdminBatchRecipes()

// Composable de gestión de escandallo directo tradicional
const activeProduct = computed<ProductRow | null | undefined>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val ?? null)
})

const {
  recipeItems,
  additionalCosts,
  newRecipeItem,
  isSubmittingRecipe,
  pendingRecipe,
  recipeErrorMessage,
  isExporting,
  isPublishing,
  publishData,
  computedTotalCost,
  profitMargin,
  profitMarginPercent,
  fetchRecipe,
  addRecipeItem,
  deleteRecipeItem,
  exportToExcel,
  publishProduct,
  resetRecipeState
} = useAdminRecipes(activeProduct)

// Cargar tandas al montar
onMounted(async () => {
  await fetchBatchRecipes()
})

// Cargar composición de producto cuando cambia activeProduct
watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal?.id) {
      fetchRecipe()
      publishData.value.price = Number(newVal.price) || 0
      publishData.value.stock = Number(newVal.stock) || 0

      isLoadingComposition.value = true
      activeProductComposition.value = await fetchProductComposition(newVal.id)
      isLoadingComposition.value = false
    } else {
      resetRecipeState()
      activeProductComposition.value = null
    }
  },
  { immediate: true }
)

// Filtrado de tandas maestras
const filteredBatches = computed(() => {
  const list = batchRecipes.value || []
  if (!batchSearchQuery.value.trim()) return list
  const q = batchSearchQuery.value.toLowerCase().trim()
  return list.filter((b) => (b.name || '').toLowerCase().includes(q))
})

// Lista segura de insumos
const safeMaterials = computed<RawMaterialRow[]>(() => {
  return props.materials?.data || []
})

const selectedMaterialUnit = computed<string>(() => {
  if (!newRecipeItem.value.raw_material_id || !props.materials?.data) return ''
  const idNum = Number(newRecipeItem.value.raw_material_id)
  const mat = props.materials.data.find((m: RawMaterialRow) => m.id === idNum)
  return mat && mat.unit ? mat.unit : ''
})

// Acciones de Tandas
function openNewBatchModal() {
  batchToEdit.value = null
  showBatchModal.value = true
}

function handleEditBatch(batch: BaseRecipeDetail) {
  batchToEdit.value = batch
  showBatchModal.value = true
}

function openQuickDeduction(batchId?: number) {
  quickDeductionBatchId.value = batchId || null
  showQuickDeductionModal.value = true
}

async function handleDeleteBatch(batch: BaseRecipeDetail) {
  const confirmed = window.confirm(
    `¿Estás seguro de eliminar la tanda maestra "${batch.name}"?\n\n` +
      `🛡️ GARANTÍA DE ALMACÉN: Los insumos del almacén NO se eliminarán ni modificarán.`
  )
  if (!confirmed) return

  const ok = await deleteBatchRecipe(batch.id)
  if (ok) {
    toast.success(`Tanda maestra "${batch.name}" eliminada sin afectar el almacén.`)
  }
}

// Acciones de Escandallo Directo y Vitrina
async function handleAddRecipeItem(isMobile = false): Promise<void> {
  if (!newRecipeItem.value.raw_material_id || !newRecipeItem.value.quantity_used) {
    toast.error('Datos incompletos', { description: 'Selecciona un insumo e ingresa la cantidad.' })
    return
  }
  const ok = await addRecipeItem()
  if (ok) {
    toast.success('Insumo agregado a la receta')
    if (isMobile) {
      isMobileAddSheetOpen.value = false
    }
  } else if (recipeErrorMessage.value) {
    toast.error('Error al agregar insumo', { description: recipeErrorMessage.value })
  }
}

async function handleDeleteRecipeItem(id: number | string, name?: string): Promise<void> {
  const ok = await deleteRecipeItem(id)
  if (ok) {
    toast.info('Insumo eliminado', { description: `${name || 'Insumo'} fue quitado de la receta.` })
  } else if (recipeErrorMessage.value) {
    toast.error('Error al quitar', { description: recipeErrorMessage.value })
  }
}

function handleExportToExcel(): void {
  exportToExcel()
  toast.success('Generando reporte Excel...', { description: 'El archivo descargará en breve.' })
}

async function handlePublishProduct(isMobile = false): Promise<void> {
  const ok = await publishProduct()
  if (ok) {
    activeProduct.value = null
    if (isMobile) {
      isMobilePublishSheetOpen.value = false
    }
    emit('refresh-catalog')
    toast.success('¡Producto actualizado y publicado en vitrina!')
  } else if (recipeErrorMessage.value) {
    toast.error('Error al publicar', { description: recipeErrorMessage.value })
  }
}

function handleProductSaved(savedProduct: ProductRow, isNew: boolean): void {
  emit('refresh-catalog')
  if (isNew && savedProduct?.id) {
    activeProduct.value = savedProduct
  }
}

async function handleCompositionSaved(composition: ProductBatchComposition) {
  activeProductComposition.value = composition
  emit('refresh-catalog')
}

async function handleDeductionCompleted() {
  emit('refresh-catalog')
}
</script>

<template>
  <div class="space-y-4 pb-24 lg:pb-2">
    <!-- ========================================== -->
    <!-- BARRA SUPERIOR: SUB-NAVEGACIÓN DE PESTAÑAS -->
    <!-- ========================================== -->
    <header class="bg-surface px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-[1.5rem] border border-brand-primary/15 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Selector de Modo de Recetas -->
      <div class="flex items-center gap-1.5 p-1 bg-brand-cream/60 rounded-xl border border-brand-primary/10">
        <button
          type="button"
          @click="activeSubTab = 'batches'"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeSubTab === 'batches'
              ? 'bg-brand-primary text-white shadow-soft-sm'
              : 'text-brand-secondary hover:text-brand-primary hover:bg-white/50'
          ]"
        >
          <Icon name="lucide:chef-hat" class="w-4 h-4" />
          <span>Tandas Maestras</span>
          <span
            :class="[
              'px-1.5 py-0.2 rounded-full text-[10px] font-black',
              activeSubTab === 'batches' ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary'
            ]"
          >
            {{ batchRecipes.length }}
          </span>
        </button>

        <button
          type="button"
          @click="activeSubTab = 'products'"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeSubTab === 'products'
              ? 'bg-brand-primary text-white shadow-soft-sm'
              : 'text-brand-secondary hover:text-brand-primary hover:bg-white/50'
          ]"
        >
          <Icon name="lucide:calculator" class="w-4 h-4" />
          <span>Costeo por Producto</span>
          <span
            :class="[
              'px-1.5 py-0.2 rounded-full text-[10px] font-black',
              activeSubTab === 'products' ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary'
            ]"
          >
            {{ catalog?.data?.length || 0 }}
          </span>
        </button>
      </div>

      <!-- Acciones Rápidas Destacadas -->
      <div class="flex items-center gap-2">
        <!-- Botón Descargo Rápido de Piezas (Visible siempre) -->
        <button
          type="button"
          @click="openQuickDeduction()"
          class="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-soft-sm cursor-pointer active:scale-95"
          title="Descargar piezas de consumo o merma sin cálculos"
        >
          <Icon name="lucide:minus-circle" class="w-4 h-4 text-amber-700" />
          <span>Descargo Rápido</span>
        </button>

        <!-- Botón Nueva Tanda (en tab tandas) -->
        <button
          v-if="activeSubTab === 'batches'"
          type="button"
          @click="openNewBatchModal"
          class="px-3.5 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#3C4A1C] transition-all shadow-soft-sm cursor-pointer active:scale-95"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>Nueva Tanda</span>
        </button>
      </div>
    </header>

    <!-- ============================================================== -->
    <!-- SUB-PESTAÑA 1: TANDAS MAESTRAS DE PRODUCCIÓN                   -->
    <!-- ============================================================== -->
    <div v-if="activeSubTab === 'batches'" class="space-y-4">
      <!-- Barra de Filtros de Tandas -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 sm:px-4 sm:py-3 rounded-2xl border border-brand-primary/15 shadow-soft-sm">
        <div class="relative flex-1 max-w-md">
          <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/40" />
          <input
            v-model="batchSearchQuery"
            type="text"
            placeholder="Buscar tanda por nombre..."
            class="w-full pl-9 pr-3 py-2 bg-brand-cream/30 rounded-xl border border-brand-primary/15 text-xs font-bold text-brand-secondary focus:outline-none focus:bg-white focus:border-brand-primary"
          />
        </div>
        <div class="text-xs text-brand-primary/80 font-semibold self-center">
          Mostrando {{ filteredBatches.length }} de {{ batchRecipes.length }} recetas maestras
        </div>
      </div>

      <!-- Estado Vacío cuando no hay tandas -->
      <div
        v-if="batchRecipes.length === 0 && !isLoadingBatches"
        class="flex flex-col items-center justify-center py-16 bg-surface rounded-2xl border border-brand-primary/15 shadow-soft-sm text-center px-4"
      >
        <div class="w-16 h-16 rounded-2xl bg-brand-cream border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-3 shadow-inner">
          <Icon name="lucide:chef-hat" class="w-8 h-8 opacity-80" />
        </div>
        <h3 class="text-base sm:text-lg font-playfair font-bold text-brand-secondary mb-1">
          Aún no tienes tandas maestras registradas
        </h3>
        <p class="text-brand-primary/80 font-medium text-xs sm:text-sm max-w-md mx-auto mb-4 leading-relaxed">
          Crea tu primera receta base (ej. "Masa Brioche para Roles") con sus ingredientes y rendimientos para calcular costos y porciones en vivo.
        </p>
        <button
          type="button"
          @click="openNewBatchModal"
          class="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#3C4A1C] shadow-soft-sm active:scale-95 transition-all cursor-pointer"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>Crear Primera Tanda Maestra</span>
        </button>
      </div>

      <!-- Grid de Tarjetas de Tandas Maestras -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="batch in filteredBatches"
          :key="batch.id"
          class="bg-surface rounded-2xl border border-brand-primary/15 shadow-soft-sm hover:shadow-soft-md transition-all p-5 flex flex-col justify-between space-y-4 relative group"
        >
          <!-- Cabecera de la Tarjeta -->
          <div>
            <div class="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 class="font-playfair font-bold text-base sm:text-lg text-brand-secondary group-hover:text-brand-primary transition-colors">
                  {{ batch.name }}
                </h4>
                <p v-if="batch.description" class="text-xs text-brand-primary/70 line-clamp-1 mt-0.5">
                  {{ batch.description }}
                </p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shrink-0">
                {{ batch.items.length }} insumos
              </span>
            </div>

            <!-- Métricas Financieras de la Tanda -->
            <div class="grid grid-cols-3 gap-2 p-3 bg-brand-cream/30 rounded-xl border border-brand-primary/10 my-3 text-center">
              <div>
                <span class="text-[9px] font-bold uppercase tracking-wider text-brand-primary/70 block">Insumos</span>
                <span class="text-xs sm:text-sm font-bold text-brand-secondary">
                  S/ {{ batch.materials_total_cost.toFixed(2) }}
                </span>
              </div>
              <div>
                <span class="text-[9px] font-bold uppercase tracking-wider text-brand-primary/70 block">CIF</span>
                <span class="text-xs sm:text-sm font-bold text-brand-secondary">
                  S/ {{ batch.cif_total.toFixed(2) }}
                </span>
              </div>
              <div class="border-l border-brand-primary/15 pl-1">
                <span class="text-[9px] font-bold uppercase tracking-wider text-brand-primary block">Total Tanda</span>
                <span class="text-xs sm:text-sm font-black text-brand-primary">
                  S/ {{ batch.total_batch_cost.toFixed(2) }}
                </span>
              </div>
            </div>

            <!-- Rendimientos / Formatos de Corte -->
            <div class="space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-brand-primary/80 flex items-center gap-1">
                <Icon name="lucide:scissors" class="w-3 h-3 text-brand-primary" />
                Formatos de Corte y Costo por Pieza
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div
                  v-for="y in batch.yields"
                  :key="y.id"
                  class="p-2 bg-white rounded-lg border border-brand-primary/10 flex items-center justify-between text-xs"
                >
                  <div class="truncate mr-1">
                    <span class="font-bold text-brand-secondary block truncate">{{ y.size_name }}</span>
                    <span class="text-[10px] text-brand-primary/70 font-semibold">Rinde {{ y.yield_units }} u</span>
                  </div>
                  <span class="font-black text-brand-primary shrink-0 bg-brand-cream/50 px-1.5 py-0.5 rounded">
                    S/ {{ y.unit_cost.toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones de Tarjeta -->
          <div class="pt-3 border-t border-brand-primary/10 flex items-center justify-between gap-2">
            <button
              type="button"
              @click="openQuickDeduction(batch.id)"
              class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Descargar piezas de esta tanda"
            >
              <Icon name="lucide:minus" class="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="handleEditBatch(batch)"
                class="px-2.5 py-1.5 bg-brand-cream/60 hover:bg-brand-primary hover:text-white text-brand-secondary rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Icon name="lucide:edit-3" class="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                @click="handleDeleteBatch(batch)"
                class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar tanda (no toca almacén)"
              >
                <Icon name="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- SUB-PESTAÑA 2: ESCANDALLO COMERCIAL DE PRODUCTOS               -->
    <!-- ============================================================== -->
    <div v-else class="space-y-4">
      <!-- Selector de Producto y Controles de Vitrina -->
      <header class="bg-surface px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-brand-primary/15 shadow-soft-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <!-- Selector -->
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            <Icon name="lucide:cake-slice" class="w-4.5 h-4.5" />
          </div>
          <div class="flex-1 min-w-0">
            <CustomSelect 
              v-model="activeProduct"
              :options="(catalog?.data || []).map((p: ProductRow) => ({ label: p.name, value: p }))"
              placeholder="Selecciona un pastel o producto..."
              bgClass="bg-brand-cream/50"
              class="w-full text-xs sm:text-sm"
            />
          </div>
          <button 
            @click="showProductModal = true" 
            class="h-10 px-3 bg-brand-primary text-white rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#3C4A1C] transition-colors shadow-soft-sm cursor-pointer shrink-0 text-xs font-bold active:scale-95"
            aria-label="Nuevo Producto"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
            <span class="hidden sm:inline">Nuevo</span>
          </button>
        </div>

        <!-- Controles de Vitrina Comercial en Desktop -->
        <div v-if="activeProduct" class="hidden lg:flex items-center gap-3 shrink-0 pl-3 border-l border-brand-primary/15">
          <span 
            v-if="Number(activeProduct?.price || 0) > 0" 
            class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex items-center gap-1"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
            Vitrina Activa
          </span>
          <span 
            v-else 
            class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Borrador
          </span>

          <div class="flex items-center gap-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-brand-primary/80">Precio S/</label>
            <div class="relative w-24">
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-primary/50 font-bold text-xs">S/</span>
              <input 
                v-model="publishData.price"
                type="number" 
                step="0.01"
                required
                class="w-full pl-6 pr-2 py-1.5 bg-brand-cream/60 rounded-lg border border-brand-primary/20 text-xs font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-brand-primary/80">Stock</label>
            <input 
              v-model="publishData.stock"
              type="number" 
              min="0"
              required
              class="w-16 px-2 py-1.5 bg-brand-cream/60 rounded-lg border border-brand-primary/20 text-xs font-bold text-brand-secondary text-center focus:outline-none focus:border-brand-primary"
            />
          </div>

          <button 
            @click="handlePublishProduct(false)" 
            :disabled="isPublishing" 
            class="bg-brand-primary text-white font-bold px-3.5 py-1.5 rounded-lg hover:bg-[#3C4A1C] transition-colors shadow-soft-sm disabled:opacity-50 flex items-center gap-1.5 text-xs cursor-pointer active:scale-95"
          >
            <Icon v-if="isPublishing" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
            <Icon v-else name="lucide:store" class="w-3.5 h-3.5" />
            <span>{{ isPublishing ? 'Guardando...' : 'Publicar' }}</span>
          </button>
        </div>
      </header>

      <!-- Estado cuando NO hay producto seleccionado -->
      <div 
        v-if="!activeProduct" 
        class="flex flex-col items-center justify-center py-16 sm:py-24 bg-surface rounded-2xl border border-brand-primary/15 shadow-soft-sm text-center px-4"
      >
        <div class="w-16 h-16 rounded-2xl bg-brand-cream border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-3 shadow-inner">
          <Icon name="lucide:calculator" class="w-8 h-8 opacity-80" />
        </div>
        <h3 class="text-base sm:text-lg font-playfair font-bold text-brand-secondary mb-1">
          Ningún producto comercial seleccionado
        </h3>
        <p class="text-brand-primary/80 font-medium text-xs sm:text-sm max-w-sm mx-auto text-balance leading-relaxed">
          Elige un pastel o postre en el selector superior para ver su costeo por tandas o gestionar su escandallo tradicional.
        </p>
      </div>

      <!-- CUERPO CUANDO HAY PRODUCTO -->
      <div v-else class="space-y-4">
        <!-- BANNER DE COMPOSICIÓN POR TANDAS -->
        <div class="bg-surface p-4 sm:p-5 rounded-2xl border border-brand-primary/15 shadow-soft-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <Icon name="lucide:layers" class="w-5 h-5" />
              </div>
              <div>
                <h4 class="font-playfair font-bold text-sm sm:text-base text-brand-secondary">
                  Composición de Tanda y Empaques Directos
                </h4>
                <p v-if="activeProductComposition?.mapping" class="text-xs text-brand-primary font-medium">
                  Usa {{ activeProductComposition.mapping.units_contained }} piezas de 
                  <strong>{{ activeProductComposition.mapping.base_recipe_name }} ({{ activeProductComposition.mapping.size_name }})</strong>
                  + {{ activeProductComposition.packaging_items.length }} empaques
                </p>
                <p v-else class="text-xs text-brand-primary/70">
                  ¿Este postre se prepara a partir de una masa base o tanda? Configura su porción y empaques en 1 clic.
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="showProductMappingModal = true"
              class="px-3.5 py-2 bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Icon name="lucide:settings-2" class="w-4 h-4" />
              <span>{{ activeProductComposition?.mapping ? 'Modificar Tanda y Empaques' : 'Asignar Tanda y Empaques' }}</span>
            </button>
          </div>

          <!-- Si ya tiene composición asignada, mostrar resumen visual -->
          <div v-if="activeProductComposition?.mapping" class="mt-4 pt-3 border-t border-brand-primary/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-2.5 bg-brand-cream/30 rounded-xl">
              <span class="text-[9px] font-bold text-brand-primary uppercase block">Costo Masa</span>
              <span class="text-sm font-bold text-brand-secondary">
                S/ {{ activeProductComposition.mapping.dough_cost.toFixed(2) }}
              </span>
            </div>
            <div class="p-2.5 bg-brand-cream/30 rounded-xl">
              <span class="text-[9px] font-bold text-brand-primary uppercase block">Costo Empaques</span>
              <span class="text-sm font-bold text-brand-secondary">
                S/ {{ activeProductComposition.packaging_items.reduce((s, p) => s + p.total_cost, 0).toFixed(2) }}
              </span>
            </div>
            <div class="p-2.5 bg-brand-cream/30 rounded-xl">
              <span class="text-[9px] font-bold text-brand-primary uppercase block">Costo Total Producción</span>
              <span class="text-sm font-black text-brand-primary">
                S/ {{ activeProductComposition.total_product_cost.toFixed(2) }}
              </span>
            </div>
            <div class="p-2.5 bg-brand-cream/30 rounded-xl">
              <span class="text-[9px] font-bold text-brand-primary uppercase block">Margen Comercial</span>
              <span class="text-sm font-black text-brand-secondary">
                S/ {{ (Number(activeProduct?.price || 0) - activeProductComposition.total_product_cost).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <!-- ESCANDALLO DIRECTO TRADICIONAL (RETROCOMPATIBILIDAD) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <!-- Tarjeta KPI & Formulario de Escandallo Tradicional -->
          <div class="lg:col-span-5 space-y-4">
            <section class="bg-[#4A5D23] p-4 sm:p-5 rounded-2xl border border-[#4A5D23]/20 shadow-md text-[#F4F1E1] relative overflow-hidden">
              <div class="relative z-10">
                <div class="grid grid-cols-2 gap-3 pb-3 border-b border-white/15">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-[#F4F1E1]/70 block mb-0.5">
                      Costo Tradicional
                    </span>
                    <div class="flex items-baseline gap-1">
                      <span class="text-lg font-bold text-[#F4F1E1]/80">S/</span>
                      <span class="text-3xl sm:text-4xl font-black font-inter tracking-tight">
                        {{ computedTotalCost.toFixed(2) }}
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-[#F4F1E1]/70 block mb-0.5">
                      Margen Neto
                    </span>
                    <span :class="profitMargin > 0 ? 'text-[#a3e635] font-black text-xl' : 'text-red-300 font-black text-xl'">
                      S/ {{ profitMargin.toFixed(2) }}
                    </span>
                    <span v-if="profitMarginPercent > 0" class="block text-[10px] text-[#a3e635] font-black">
                      {{ profitMarginPercent.toFixed(1) }}%
                    </span>
                  </div>
                </div>

                <!-- CIF tradicional -->
                <div class="mt-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-white/80">
                      Costos Indirectos (CIF)
                    </span>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <label class="block text-[9px] font-bold text-white/70 uppercase tracking-wider mb-1">Empaques</label>
                      <input 
                        v-model="additionalCosts.packaging" 
                        type="number" 
                        step="0.1" 
                        min="0"
                        class="w-full pl-2 pr-1 py-1 bg-white/10 rounded-lg text-xs font-bold text-white focus:outline-none focus:bg-white/20"
                      />
                    </div>
                    <div>
                      <label class="block text-[9px] font-bold text-white/70 uppercase tracking-wider mb-1">Servicios</label>
                      <input 
                        v-model="additionalCosts.utilities" 
                        type="number" 
                        step="0.1" 
                        min="0"
                        class="w-full pl-2 pr-1 py-1 bg-white/10 rounded-lg text-xs font-bold text-white focus:outline-none focus:bg-white/20"
                      />
                    </div>
                    <div>
                      <label class="block text-[9px] font-bold text-white/70 uppercase tracking-wider mb-1">Mano Obra</label>
                      <input 
                        v-model="additionalCosts.labor" 
                        type="number" 
                        step="0.1" 
                        min="0"
                        class="w-full pl-2 pr-1 py-1 bg-white/10 rounded-lg text-xs font-bold text-white focus:outline-none focus:bg-white/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Formulario agregar insumo directo -->
            <section class="bg-surface p-4 sm:p-5 rounded-2xl border border-brand-primary/15 shadow-soft-sm">
              <h4 class="text-xs font-bold uppercase tracking-wider text-brand-secondary mb-3 flex items-center gap-1.5">
                <Icon name="lucide:plus-circle" class="w-4 h-4 text-brand-primary" />
                Agregar Insumo Directo
              </h4>
              <form @submit.prevent="handleAddRecipeItem(false)" class="space-y-3">
                <div>
                  <select
                    v-model="newRecipeItem.raw_material_id"
                    class="w-full px-3 py-2 bg-brand-cream/40 rounded-xl border border-brand-primary/20 text-xs font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                  >
                    <option value="" disabled>Selecciona insumo directo...</option>
                    <option
                      v-for="mat in safeMaterials"
                      :key="mat.id"
                      :value="mat.id"
                    >
                      {{ mat.name }} ({{ mat.unit }})
                    </option>
                  </select>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="newRecipeItem.quantity_used"
                    type="number"
                    step="0.01"
                    min="0.001"
                    placeholder="Cantidad usada"
                    class="w-full px-3 py-2 bg-brand-cream/40 rounded-xl border border-brand-primary/20 text-xs font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                  />
                  <span class="text-xs font-bold text-brand-primary/70 shrink-0 w-8">{{ selectedMaterialUnit }}</span>
                  <button
                    type="submit"
                    :disabled="isSubmittingRecipe"
                    class="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-[#3C4A1C] transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </section>
          </div>

          <!-- Columna Derecha: Tabla de Insumos Directos Registrados -->
          <div class="lg:col-span-7 bg-surface p-4 sm:p-5 rounded-2xl border border-brand-primary/15 shadow-soft-sm space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-brand-secondary flex items-center gap-1.5">
                <Icon name="lucide:list" class="w-4 h-4 text-brand-primary" />
                Insumos Directos Registrados ({{ recipeItems.length }})
              </h4>
              <button
                type="button"
                @click="handleExportToExcel"
                class="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name="lucide:download" class="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>
            </div>

            <div v-if="recipeItems.length === 0" class="py-8 text-center text-xs text-brand-primary/70">
              Este producto no tiene insumos directos agregados individualmente.
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="item in recipeItems"
                :key="item.id"
                class="p-2.5 bg-brand-cream/20 rounded-xl border border-brand-primary/10 flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-bold text-brand-secondary">{{ item.material_name || item.name || 'Insumo' }}</span>
                  <span class="text-brand-primary/70 block text-[11px]">
                    {{ item.quantity_used }} {{ item.unit }} &times; S/ {{ Number(item.unit_cost ?? item.cost_per_unit ?? 0).toFixed(4) }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-black text-brand-secondary">
                    S/ {{ Number(item.item_cost ?? item.item_total_cost ?? 0).toFixed(2) }}
                  </span>
                  <button
                    type="button"
                    @click="handleDeleteRecipeItem(item.id, item.material_name || item.name)"
                    class="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODALES TELEPORTADOS                       -->
    <!-- ========================================== -->
    <!-- Modal de Tanda Maestra -->
    <BatchRecipeModal
      :show="showBatchModal"
      :batchToEdit="batchToEdit"
      :materials="safeMaterials"
      @close="showBatchModal = false"
      @saved="async () => { await fetchBatchRecipes(); }"
    />

    <!-- Modal de Descargo Rápido de Piezas -->
    <QuickPieceDeductionModal
      :show="showQuickDeductionModal"
      :batchRecipes="batchRecipes"
      :materials="safeMaterials"
      :initialBatchId="quickDeductionBatchId"
      @close="showQuickDeductionModal = false"
      @deducted="handleDeductionCompleted"
    />

    <!-- Modal de Composición por Tandas y Empaques -->
    <ProductBatchMappingModal
      :show="showProductMappingModal"
      :product="activeProduct || null"
      :batchRecipes="batchRecipes"
      :materials="safeMaterials"
      @close="showProductMappingModal = false"
      @saved="handleCompositionSaved"
    />

    <!-- Modal de Producto -->
    <ProductModal 
      :show="showProductModal"
      :productToEdit="null"
      @close="showProductModal = false"
      @saved="handleProductSaved"
    />
  </div>
</template>
