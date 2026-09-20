<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { ProductRow } from '~/types/catalog'
import type { RawMaterialRow } from '~/types/inventory'
import { useAdminRecipes } from '~/composables/admin/useAdminRecipes'
import ProductModal from './ProductModal.vue'

const props = defineProps<{
  catalog: { success: boolean; data: ProductRow[] } | null | undefined
  materials: { success: boolean; data: RawMaterialRow[] } | null | undefined
  modelValue: ProductRow | null | undefined
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: ProductRow | null): void
  (e: 'refresh-catalog'): void
}>()

const activeProduct = computed<ProductRow | null | undefined>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val ?? null)
})

const showModal = ref(false)
const isMobileAddSheetOpen = ref(false)
const isMobilePublishSheetOpen = ref(false)
const isCifExpandedMobile = ref(false)

// Composable de gestión de escandallos
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

const selectedMaterialUnit = computed<string>(() => {
  if (!newRecipeItem.value.raw_material_id || !props.materials?.data) return ''
  const idNum = Number(newRecipeItem.value.raw_material_id)
  const mat = props.materials.data.find((m: RawMaterialRow) => m.id === idNum)
  return (mat && mat.unit) ? mat.unit : ''
})

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

watch(() => props.modelValue, (newVal) => {
  if (newVal?.id) {
    fetchRecipe()
    publishData.value.price = Number(newVal.price) || 0
    publishData.value.stock = Number(newVal.stock) || 0
  } else {
    resetRecipeState()
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-4 pb-24 lg:pb-2">
    <!-- ========================================== -->
    <!-- BARRA SUPERIOR INTEGRADA (DESKTOP Y MÓVIL) -->
    <!-- ========================================== -->
    <header class="bg-surface px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-[1.5rem] border border-brand-primary/15 shadow-soft-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <!-- Selector de Producto -->
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
          @click="showModal = true" 
          class="h-10 px-3 bg-brand-primary text-white rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#3C4A1C] transition-colors shadow-soft-sm cursor-pointer shrink-0 text-xs font-bold active:scale-95"
          aria-label="Nuevo Producto"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span class="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      <!-- Controles de Vitrina Comercial en Desktop (>= lg) -->
      <div v-if="activeProduct" class="hidden lg:flex items-center gap-3 shrink-0 pl-3 border-l border-brand-primary/15">
        <!-- Badge de estado -->
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

        <!-- Input Precio Venta -->
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

        <!-- Input Stock -->
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

        <!-- Botón Publicar -->
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
      class="flex flex-col items-center justify-center py-16 sm:py-24 bg-surface rounded-2xl sm:rounded-[1.75rem] border border-brand-primary/15 shadow-soft-sm text-center px-4"
    >
      <div class="w-16 h-16 rounded-2xl bg-brand-cream border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-3 shadow-inner">
        <Icon name="lucide:calculator" class="w-8 h-8 opacity-80" />
      </div>
      <h3 class="text-base sm:text-lg font-playfair font-bold text-[#2A321B] mb-1">Ningún producto seleccionado</h3>
      <p class="text-[#4A5D23]/80 font-medium text-xs sm:text-sm max-w-sm mx-auto text-balance leading-relaxed">
        Elige un pastel o postre en el selector superior para ver y calcular sus costos de producción en tiempo real.
      </p>
    </div>

    <!-- CUERPO PRINCIPAL CUANDO HAY PRODUCTO -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      
      <!-- ========================================== -->
      <!-- COLUMNA IZQUIERDA: TARJETA KPI & FORMULARIO -->
      <!-- ========================================== -->
      <div class="lg:col-span-5 space-y-4">
        
        <!-- Tarjeta KPI de Costos y Rentabilidad (Verde de marca) -->
        <section class="bg-[#4A5D23] p-4 sm:p-5 rounded-2xl border border-[#4A5D23]/20 shadow-md text-[#F4F1E1] relative overflow-hidden">
          <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
            <Icon name="lucide:calculator" class="absolute -right-6 -bottom-6 w-36 h-36 rotate-12 text-white" />
          </div>

          <div class="relative z-10">
            <!-- Fila Superior: Costo Total & Margen -->
            <div class="grid grid-cols-2 gap-3 pb-3 border-b border-white/15">
              <!-- Costo Producción -->
              <div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-[#F4F1E1]/70 block mb-0.5">
                  Costo Total
                </span>
                <div class="flex items-baseline gap-1">
                  <span class="text-lg font-bold text-[#F4F1E1]/80">S/</span>
                  <span class="text-3xl sm:text-4xl font-black font-inter tracking-tight">
                    {{ computedTotalCost.toFixed(2) }}
                  </span>
                </div>
                <span class="text-[9px] text-[#F4F1E1]/60 block mt-0.5 font-medium">Insumos + Empaque + CIF</span>
              </div>

              <!-- Margen Bruto y Precio Venta -->
              <div class="text-right flex flex-col justify-between">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-widest text-[#F4F1E1]/70 block mb-0.5">
                    Precio Venta
                  </span>
                  <span class="font-bold text-base sm:text-lg">
                    S/ {{ Number(activeProduct?.price || 0).toFixed(2) }}
                  </span>
                </div>
                <div class="mt-1">
                  <span class="text-[9px] uppercase tracking-wider text-[#F4F1E1]/70 font-semibold block">Margen Neto</span>
                  <span :class="profitMargin > 0 ? 'text-[#a3e635] font-black text-lg sm:text-xl' : 'text-red-300 font-black text-lg sm:text-xl'">
                    S/ {{ profitMargin.toFixed(2) }}
                  </span>
                  <span v-if="profitMarginPercent > 0" class="block text-[10px] text-[#a3e635] font-black">
                    {{ profitMarginPercent.toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Desglose de Costos Indirectos de Fabricación (CIF) -->
            <!-- En Desktop: Siempre visible compacto en fila -->
            <!-- En Mobile: Acordeón colapsable con botón táctil -->
            <div class="mt-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-widest text-white/80 flex items-center gap-1">
                  <Icon name="lucide:sliders" class="w-3 h-3 text-[#a3e635]" />
                  Costos Indirectos (CIF)
                </span>
                <!-- Botón toggle en móvil -->
                <button 
                  @click="isCifExpandedMobile = !isCifExpandedMobile" 
                  class="lg:hidden text-[10px] font-bold text-[#a3e635] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {{ isCifExpandedMobile ? 'Ocultar' : 'Ajustar' }}
                  <Icon :name="isCifExpandedMobile ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-3 h-3" />
                </button>
              </div>

              <div :class="['grid grid-cols-3 gap-2', isCifExpandedMobile ? 'grid' : 'hidden lg:grid']">
                <div>
                  <label class="block text-[9px] font-bold text-white/70 uppercase tracking-wider mb-1 truncate" title="Empaques & Bases">Empaques</label>
                  <div class="relative">
                    <span class="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 font-bold text-[10px]">S/</span>
                    <input 
                      type="number" 
                      v-model="additionalCosts.packaging" 
                      step="0.10" 
                      class="w-full pl-5 pr-1.5 py-1.5 bg-[#2A321B]/40 rounded-lg border border-white/15 focus:outline-none focus:border-[#a3e635] text-xs font-bold text-white shadow-inner text-right" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-[9px] font-bold text-white/70 uppercase tracking-wider mb-1 truncate" title="Servicios de Gas y Luz">Gas / Luz</label>
                  <div class="relative">
                    <span class="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 font-bold text-[10px]">S/</span>
                    <input 
                      type="number" 
                      v-model="additionalCosts.utilities" 
                      step="0.10" 
                      class="w-full pl-5 pr-1.5 py-1.5 bg-[#2A321B]/40 rounded-lg border border-white/15 focus:outline-none focus:border-[#a3e635] text-xs font-bold text-white shadow-inner text-right" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-[9px] font-bold text-white/70 uppercase tracking-wider mb-1 truncate" title="Mano de Obra">Mano Obra</label>
                  <div class="relative">
                    <span class="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 font-bold text-[10px]">S/</span>
                    <input 
                      type="number" 
                      v-model="additionalCosts.labor" 
                      step="0.10" 
                      class="w-full pl-5 pr-1.5 py-1.5 bg-[#2A321B]/40 rounded-lg border border-white/15 focus:outline-none focus:border-[#a3e635] text-xs font-bold text-white shadow-inner text-right" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Formulario Agregar Insumo (Visible en Desktop; en Mobile disponible en Bottom Sheet) -->
        <section class="hidden lg:block bg-white p-4 sm:p-5 rounded-2xl border border-[#4A5D23]/20 shadow-sm">
          <div v-if="recipeErrorMessage" class="mb-3 bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-xs flex items-start gap-2">
            <Icon name="lucide:triangle-alert" class="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span class="font-medium leading-tight">{{ recipeErrorMessage }}</span>
          </div>

          <form @submit.prevent="handleAddRecipeItem(false)" class="space-y-3">
            <div class="flex items-center justify-between border-b border-dashed border-[#4A5D23]/20 pb-2">
              <h4 class="font-playfair font-bold text-sm text-[#2A321B] flex items-center gap-1.5">
                <Icon name="lucide:plus-circle" class="w-4 h-4 text-[#4A5D23]" />
                Agregar Insumo al Escandallo
              </h4>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1">Materia Prima del Almacén</label>
              <CustomSelect 
                v-model="newRecipeItem.raw_material_id"
                :options="(materials?.data || []).map((m: RawMaterialRow) => ({ label: `${m.name} (${m.unit})`, value: m.id }))"
                placeholder="Seleccionar insumo..."
                bgClass="bg-[#F4F1E1]/50"
                class="text-xs"
              />
            </div>

            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1">Cantidad Utilizada</label>
              <div class="relative">
                <input 
                  v-model="newRecipeItem.quantity_used"
                  type="number" 
                  step="any"
                  required
                  placeholder="Ej: 250"
                  class="w-full px-3 py-2 bg-[#F4F1E1]/50 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] text-xs font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 font-black text-[#4A5D23]/60 text-xs pointer-events-none">
                  {{ selectedMaterialUnit }}
                </span>
              </div>
            </div>

            <button 
              type="submit"
              :disabled="isSubmittingRecipe"
              class="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#4A5D23] hover:bg-[#3C4A1C] rounded-xl transition-all shadow-sm active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2"
            >
              <Icon v-if="isSubmittingRecipe" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
              <Icon v-else name="lucide:plus" class="w-3.5 h-3.5" />
              <span>{{ isSubmittingRecipe ? 'Agregando...' : 'Agregar a la Ficha Técnica' }}</span>
            </button>
          </form>
        </section>
      </div>

      <!-- ========================================== -->
      <!-- COLUMNA DERECHA: FICHA TÉCNICA (TABLA / CARDS) -->
      <!-- ========================================== -->
      <div class="lg:col-span-7">
        <section class="bg-white p-4 sm:p-5 rounded-2xl border border-[#4A5D23]/20 shadow-sm flex flex-col">
          <!-- Cabecera de Ficha Técnica -->
          <div class="flex items-center justify-between mb-3 pb-3 border-b border-dashed border-[#4A5D23]/20 shrink-0">
            <div class="flex items-center gap-2">
              <Icon name="lucide:clipboard-check" class="w-4.5 h-4.5 text-[#4A5D23]" />
              <h3 class="text-base font-playfair font-bold text-[#2A321B] tracking-tight">Ficha Técnica</h3>
              <span class="text-[10px] font-black text-[#4A5D23] bg-[#F4F1E1] px-2.5 py-0.5 rounded-full border border-[#4A5D23]/20">
                {{ recipeItems.length }} insumo{{ recipeItems.length === 1 ? '' : 's' }}
              </span>
            </div>

            <button 
              @click="handleExportToExcel"
              :disabled="isExporting || recipeItems.length === 0"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-white bg-brand-primary hover:bg-[#3C4A1C] disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-sm cursor-pointer"
              aria-label="Descargar Ficha en formato Excel con fórmulas vivas"
            >
              <Icon v-if="isExporting" name="lucide:loader-2" class="w-3 h-3 animate-spin" />
              <Icon v-else name="lucide:file-spreadsheet" class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Exportar Excel</span>
            </button>
          </div>

          <!-- Estado de Carga -->
          <div v-if="pendingRecipe" class="flex flex-col items-center justify-center py-16 text-brand-primary">
            <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin mb-2" />
            <p class="text-xs font-bold tracking-widest uppercase">Calculando escandallo...</p>
          </div>

          <!-- Estado Vacío -->
          <div v-else-if="recipeItems.length === 0" class="flex flex-col items-center justify-center py-12 text-center bg-brand-cream/40 rounded-xl border border-dashed border-brand-primary/25 p-4">
            <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2 border border-brand-primary/20 shadow-soft-sm text-brand-primary">
              <Icon name="lucide:utensils-crossed" class="w-6 h-6 opacity-60" />
            </div>
            <p class="text-sm font-playfair font-bold text-brand-secondary mb-1">Sin insumos asignados</p>
            <p class="text-xs text-brand-primary/70 max-w-[240px]">
              Agrega materias primas para comenzar el costeo por gramo de este producto.
            </p>
          </div>

          <!-- VISTA DESKTOP: Tabla Compacta con scroll interno suave (cabe en una sola pantalla) -->
          <div v-else class="hidden lg:block overflow-y-auto max-h-[calc(100vh-270px)] pr-1 custom-scrollbar">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead class="sticky top-0 bg-white z-10 shadow-[0_2px_4px_-2px_rgba(74,93,35,0.1)]">
                <tr class="border-b border-brand-primary/15 text-[10px] uppercase tracking-wider text-brand-primary/80 font-bold">
                  <th class="py-2.5 px-3">Insumo</th>
                  <th class="py-2.5 px-3 text-center">Cantidad</th>
                  <th class="py-2.5 px-3 text-right">Costo Parcial</th>
                  <th class="py-2.5 px-2 text-right w-8"></th>
                </tr>
              </thead>
              <tbody v-auto-animate class="divide-y divide-brand-primary/10 text-xs">
                <tr v-for="item in recipeItems" :key="item.id" class="hover:bg-brand-cream/40 transition-colors">
                  <td class="py-2 px-3">
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-brand-secondary">{{ item.material_name || item.name }}</span>
                      <span class="text-[9px] text-brand-primary/70 font-semibold bg-brand-primary/5 px-1.5 py-0.5 rounded">
                        S/ {{ Number(item.unit_cost ?? item.cost_per_unit ?? 0).toFixed(2) }} x {{ item.unit }}
                      </span>
                    </div>
                  </td>
                  <td class="py-2 px-3 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-cream text-brand-primary border border-brand-primary/20">
                      {{ item.quantity_used }} {{ item.unit }}
                    </span>
                  </td>
                  <td class="py-2 px-3 text-right font-black text-brand-secondary font-inter text-sm">
                    <span class="text-brand-primary/50 text-[10px] mr-0.5">S/</span>{{ Number(item.item_cost ?? item.item_total_cost ?? 0).toFixed(2) }}
                  </td>
                  <td class="py-2 px-2 text-right">
                    <button 
                      @click="handleDeleteRecipeItem(item.id, item.material_name || item.name)"
                      class="inline-flex items-center justify-center w-6 h-6 rounded-md text-status-danger hover:text-white hover:bg-status-danger transition-colors cursor-pointer"
                      aria-label="Quitar insumo"
                    >
                      <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- VISTA MOBILE: Mobile Cards Táctiles (legibles, sin cortes ni scroll lateral) -->
          <div v-if="recipeItems.length > 0" class="lg:hidden space-y-2.5">
            <div 
              v-for="item in recipeItems" 
              :key="item.id"
              class="bg-brand-cream/40 border border-brand-primary/15 p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
            >
              <div class="min-w-0 flex-1">
                <p class="font-bold text-xs text-brand-secondary truncate">{{ item.material_name || item.name }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white text-brand-primary border border-brand-primary/20">
                    {{ item.quantity_used }} {{ item.unit }}
                  </span>
                  <span class="text-[10px] text-brand-primary/70 font-medium">
                    S/ {{ Number(item.unit_cost ?? item.cost_per_unit ?? 0).toFixed(2) }} / {{ item.unit }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2.5 shrink-0">
                <div class="text-right">
                  <span class="text-[9px] uppercase tracking-wider text-brand-primary/70 block font-semibold">Subtotal</span>
                  <span class="text-sm font-black text-brand-secondary font-inter">
                    S/ {{ Number(item.item_cost ?? item.item_total_cost ?? 0).toFixed(2) }}
                  </span>
                </div>
                <button 
                  @click="handleDeleteRecipeItem(item.id, item.material_name || item.name)"
                  class="w-8 h-8 rounded-lg bg-white border border-red-200 text-status-danger flex items-center justify-center active:bg-red-50 cursor-pointer"
                  aria-label="Eliminar insumo"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- STICKY BOTTOM BAR EN MOBILE (< lg) -->
    <!-- ========================================== -->
    <div 
      v-if="activeProduct" 
      class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-brand-primary/20 px-4 py-2.5 flex items-center gap-2.5 shadow-soft-lg"
    >
      <button 
        @click="isMobileAddSheetOpen = true"
        class="flex-1 min-h-[44px] bg-brand-primary text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-soft-sm active:scale-95 transition-transform cursor-pointer"
        aria-label="Abrir formulario para agregar insumo"
      >
        <Icon name="lucide:plus" class="w-4.5 h-4.5" />
        <span>Agregar Insumo</span>
      </button>

      <button 
        @click="isMobilePublishSheetOpen = true"
        class="min-h-[44px] bg-brand-cream text-brand-secondary border border-brand-primary/30 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs active:scale-95 transition-transform cursor-pointer"
        aria-label="Abrir panel comercial de vitrina"
      >
        <Icon name="lucide:store" class="w-4 h-4 text-brand-primary" />
        <span>Vitrina</span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- BOTTOM SHEET: AGREGAR INSUMO EN MOBILE -->
    <!-- ========================================== -->
    <Teleport to="body">
      <div v-if="isMobileAddSheetOpen" class="fixed inset-0 z-[9999] flex items-end justify-center lg:hidden">
        <!-- Backdrop -->
        <div 
          @click="isMobileAddSheetOpen = false" 
          class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        ></div>

        <!-- Sheet Modal Content -->
        <div class="relative w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar bg-surface rounded-t-3xl p-5 shadow-soft-lg z-10 border-t border-brand-primary/20 animate-in slide-in-from-bottom duration-200">
          <div class="w-12 h-1 bg-brand-primary/20 rounded-full mx-auto mb-4"></div>
          
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-dashed border-brand-primary/20">
            <h3 class="font-playfair font-bold text-base text-brand-secondary flex items-center gap-2">
              <Icon name="lucide:plus-circle" class="w-5 h-5 text-brand-primary" />
              Agregar Insumo a la Ficha
            </h3>
            <button 
              @click="isMobileAddSheetOpen = false" 
              class="w-8 h-8 rounded-lg flex items-center justify-center text-brand-secondary/60 hover:text-brand-secondary hover:bg-brand-cream/60 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleAddRecipeItem(true)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-1.5">Insumo del Almacén</label>
              <CustomSelect 
                v-model="newRecipeItem.raw_material_id"
                :options="(materials?.data || []).map((m: RawMaterialRow) => ({ label: `${m.name} (${m.unit})`, value: m.id }))"
                placeholder="Selecciona un insumo..."
                bgClass="bg-brand-cream"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-1.5">Cantidad Utilizada</label>
              <div class="relative">
                <input 
                  v-model="newRecipeItem.quantity_used"
                  type="number" 
                  step="any"
                  required
                  placeholder="Ej: 200"
                  class="w-full min-h-[44px] px-4 py-2.5 bg-brand-cream/60 rounded-xl border border-brand-primary/20 text-sm font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-brand-primary text-sm pointer-events-none">
                  {{ selectedMaterialUnit }}
                </span>
              </div>
            </div>

            <button 
              type="submit"
              :disabled="isSubmittingRecipe"
              class="w-full min-h-[44px] py-3 bg-brand-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-soft-sm mt-2 disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <Icon v-if="isSubmittingRecipe" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:plus" class="w-4 h-4" />
              <span>{{ isSubmittingRecipe ? 'Guardando...' : 'Agregar Insumo' }}</span>
            </button>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ========================================== -->
    <!-- BOTTOM SHEET: VITRINA COMERCIAL EN MOBILE -->
    <!-- ========================================== -->
    <Teleport to="body">
      <div v-if="isMobilePublishSheetOpen" class="fixed inset-0 z-[9999] flex items-end justify-center lg:hidden">
        <!-- Backdrop -->
        <div 
          @click="isMobilePublishSheetOpen = false" 
          class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        ></div>

        <!-- Sheet Modal Content -->
        <div class="relative w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar bg-surface rounded-t-3xl p-5 shadow-soft-lg z-10 border-t border-brand-primary/20 animate-in slide-in-from-bottom duration-200">
          <div class="w-12 h-1 bg-brand-primary/20 rounded-full mx-auto mb-4"></div>
          
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-dashed border-brand-primary/20">
            <h3 class="font-playfair font-bold text-base text-brand-secondary flex items-center gap-2">
              <Icon name="lucide:store" class="w-5 h-5 text-brand-primary" />
              Vitrina Comercial
            </h3>
            <button 
              @click="isMobilePublishSheetOpen = false" 
              class="w-8 h-8 rounded-lg flex items-center justify-center text-brand-secondary/60 hover:text-brand-secondary hover:bg-brand-cream/60 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handlePublishProduct(true)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-1.5">Precio de Venta al Público</label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary/60 font-bold text-sm">S/</span>
                <input 
                  v-model="publishData.price"
                  type="number" 
                  step="0.01"
                  required
                  class="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-brand-cream/60 rounded-xl border border-brand-primary/20 text-sm font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                />
              </div>
              <p class="text-[10px] text-brand-primary/70 mt-1 font-medium">
                Sugerido (30% neto): S/ {{ (computedTotalCost * 1.428).toFixed(2) }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-1.5">Stock en Tienda</label>
              <input 
                v-model="publishData.stock"
                type="number" 
                min="0"
                required
                class="w-full min-h-[44px] px-4 py-2.5 bg-brand-cream/60 rounded-xl border border-brand-primary/20 text-sm font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
              />
            </div>

            <button 
              type="submit" 
              :disabled="isPublishing" 
              class="w-full min-h-[44px] py-3 bg-brand-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-soft-sm mt-2 disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <Icon v-if="isPublishing" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:check" class="w-4 h-4" />
              <span>{{ isPublishing ? 'Actualizando...' : 'Guardar y Publicar en Tienda' }}</span>
            </button>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal de Producto -->
    <ProductModal 
      :show="showModal"
      :productToEdit="null"
      @close="showModal = false"
      @saved="handleProductSaved"
    />
  </div>
</template>

