<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { ProductRow } from '~/types/catalog'
import type { RawMaterialRow } from '~/types/inventory'
import type { BaseRecipeDetail, ProductBatchComposition } from '~/types/batch-recipe'
import { calculateProductMargins } from '~/composables/admin/useAdminBatchRecipes'

interface FormPackaging {
  raw_material_id: number | ''
  quantity_used: number | ''
}

const props = defineProps<{
  show: boolean
  product: ProductRow | null
  batchRecipes: BaseRecipeDetail[]
  materials: RawMaterialRow[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', composition: ProductBatchComposition): void
}>()

const selectedBatchId = ref<number | ''>('')
const selectedYieldId = ref<number | ''>('')
const unitsContained = ref<number | ''>(1)
const packagingItems = ref<FormPackaging[]>([])

const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

watch(
  () => props.show,
  async (newVal) => {
    if (newVal && props.product?.id) {
      errorMessage.value = ''
      await loadProductComposition(props.product.id)
    }
  }
)

async function loadProductComposition(productId: number) {
  isLoading.value = true
  try {
    const res = await $fetch<{ success: boolean; data: ProductBatchComposition }>(
      `/api/admin/product-recipes/${productId}/composition`
    )
    if (res?.success && res.data) {
      const comp = res.data
      if (comp.mapping) {
        selectedBatchId.value = comp.mapping.base_recipe_id
        selectedYieldId.value = comp.mapping.recipe_yield_id
        unitsContained.value = comp.mapping.units_contained
      } else {
        selectedBatchId.value = props.batchRecipes[0]?.id || ''
        selectedYieldId.value = props.batchRecipes[0]?.yields[0]?.id || ''
        unitsContained.value = 1
      }

      if (comp.packaging_items && comp.packaging_items.length > 0) {
        packagingItems.value = comp.packaging_items.map((pkg) => ({
          raw_material_id: pkg.raw_material_id,
          quantity_used: pkg.quantity_used
        }))
      } else {
        packagingItems.value = []
      }
    }
  } catch (err) {
    console.error('Error al cargar composición de producto:', err)
  } finally {
    isLoading.value = false
  }
}

const activeBatch = computed<BaseRecipeDetail | null>(() => {
  if (!selectedBatchId.value) return null
  return props.batchRecipes.find((b) => b.id === Number(selectedBatchId.value)) || null
})

const activeYield = computed(() => {
  if (!activeBatch.value || !selectedYieldId.value) return null
  return activeBatch.value.yields.find((y) => y.id === Number(selectedYieldId.value)) || null
})

watch(selectedBatchId, (newBatchId) => {
  if (newBatchId) {
    const b = props.batchRecipes.find((x) => x.id === Number(newBatchId))
    if (b && b.yields.length > 0) {
      const alreadyHasYield = b.yields.some((y) => y.id === Number(selectedYieldId.value))
      if (!alreadyHasYield && b.yields[0]) {
        selectedYieldId.value = b.yields[0].id ?? ''
      }
    } else {
      selectedYieldId.value = ''
    }
  }
})

// Insumos ordenados alfabéticamente
const sortedMaterials = computed(() => {
  return [...props.materials].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

function getMaterial(id: number | '') {
  if (!id) return null
  return props.materials.find((m) => m.id === Number(id)) || null
}

function getPkgCost(pkg: FormPackaging): number {
  const mat = getMaterial(pkg.raw_material_id)
  if (!mat || !pkg.quantity_used) return 0
  const price = Number(mat.purchase_price) || 0
  const purchaseQty = Number(mat.purchase_quantity) || 1
  return Number(((price / purchaseQty) * Number(pkg.quantity_used)).toFixed(2))
}

function addPackaging() {
  packagingItems.value.push({ raw_material_id: '', quantity_used: 1 })
}

function removePackaging(index: number) {
  packagingItems.value.splice(index, 1)
}

// Costos en tiempo real
const doughCost = computed<number>(() => {
  if (!activeYield.value || !unitsContained.value) return 0
  const pieceCost = activeYield.value.unit_cost || 0
  return Number((pieceCost * Number(unitsContained.value)).toFixed(2))
})

const packagingTotalCost = computed<number>(() => {
  let sum = 0
  for (const pkg of packagingItems.value) {
    sum += getPkgCost(pkg)
  }
  return Number(sum.toFixed(2))
})

const totalProductionCost = computed<number>(() => {
  return Number((doughCost.value + packagingTotalCost.value).toFixed(2))
})

const productSalePrice = computed<number>(() => {
  return Number(props.product?.price || 0)
})

const margins = computed(() => {
  return calculateProductMargins(productSalePrice.value, totalProductionCost.value)
})

function closeModal() {
  emit('close')
}

async function handleSave() {
  if (!props.product?.id) return
  errorMessage.value = ''

  if (!selectedYieldId.value || !unitsContained.value || Number(unitsContained.value) <= 0) {
    errorMessage.value = 'Selecciona una tanda, un corte y la cantidad de piezas contenidas.'
    return
  }

  isSubmitting.value = true
  try {
    const validPackagings = packagingItems.value
      .filter((pkg) => pkg.raw_material_id !== '' && Number(pkg.quantity_used) > 0)
      .map((pkg) => ({
        product_id: props.product!.id,
        raw_material_id: Number(pkg.raw_material_id),
        quantity_used: Number(pkg.quantity_used)
      }))

    const payload = {
      product_id: props.product.id,
      mapping: {
        recipe_yield_id: Number(selectedYieldId.value),
        units_contained: Number(unitsContained.value)
      },
      packaging_items: validPackagings
    }

    const res = await $fetch<{ success: boolean; data: ProductBatchComposition }>(
      '/api/admin/product-recipes/mapping',
      {
        method: 'POST',
        body: payload
      }
    )

    if (res?.success && res.data) {
      toast.success(`Composición comercial asignada a "${props.product.name}"`)
      emit('saved', res.data)
      closeModal()
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string; error?: { message?: string } }; message?: string }
    errorMessage.value =
      fetchErr.data?.error?.message ||
      fetchErr.data?.statusMessage ||
      fetchErr.message ||
      'Error al guardar la composición de tanda del producto.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ClientOnly>
    <Teleport to="#admin-modal-portal">
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto pointer-events-auto"
      >
        <!-- Overlay -->
        <div
          class="fixed inset-0 bg-[#2A321B]/50 backdrop-blur-sm transition-opacity"
          @click="closeModal"
        ></div>

        <!-- Modal Container -->
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-mapping-title"
          class="relative w-full max-w-3xl bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl overflow-hidden animate-pop border border-[#4A5D23]/10 max-h-[92vh] flex flex-col z-10"
        >
          <!-- Header -->
          <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-brand-primary/10 flex items-center justify-between bg-surface shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <Icon name="lucide:boxes" class="w-5 h-5" />
              </div>
              <div>
                <h3 id="modal-mapping-title" class="text-lg sm:text-xl font-playfair font-black text-brand-secondary">
                  Composición de Tanda y Empaques
                </h3>
                <p class="text-xs text-brand-primary/80 font-medium">
                  Producto Comercial: <strong>{{ product?.name }}</strong> (S/ {{ Number(product?.price || 0).toFixed(2) }})
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar modal"
              @click="closeModal"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-brand-primary/20 text-brand-secondary hover:bg-brand-cream hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Body Scrollable -->
          <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
            <!-- Spinner mientras carga composición -->
            <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center text-brand-primary gap-2">
              <Icon name="lucide:loader-2" class="w-7 h-7 animate-spin" />
              <span class="text-xs font-bold">Cargando escandallo de tanda...</span>
            </div>

            <template v-else>
              <!-- Error Banner -->
              <div
                v-if="errorMessage"
                class="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-start gap-2.5"
              >
                <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{{ errorMessage }}</span>
              </div>

              <!-- Sección 1: Selección de Tanda Base y Formato -->
              <div class="p-4 bg-brand-cream/30 rounded-2xl border border-brand-primary/15 space-y-3">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:layers" class="w-4 h-4 text-brand-primary" />
                  <span class="text-xs font-bold text-brand-secondary uppercase tracking-wider">
                    1. Porción de Tanda Base (Masa / Relleno)
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <!-- Tanda Base -->
                  <div class="sm:col-span-5">
                    <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
                      Tanda Base Maestra
                    </label>
                    <select
                      v-model="selectedBatchId"
                      class="w-full px-3 py-2 bg-white rounded-xl border border-brand-primary/20 text-xs font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                    >
                      <option value="" disabled>Selecciona una tanda...</option>
                      <option
                        v-for="b in batchRecipes"
                        :key="b.id"
                        :value="b.id"
                      >
                        {{ b.name }} (Costo Tanda S/ {{ b.total_batch_cost.toFixed(2) }})
                      </option>
                    </select>
                  </div>

                  <!-- Corte de Rendimiento -->
                  <div class="sm:col-span-4">
                    <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
                      Corte / Tamaño
                    </label>
                    <select
                      v-model="selectedYieldId"
                      :disabled="!activeBatch"
                      class="w-full px-3 py-2 bg-white rounded-xl border border-brand-primary/20 text-xs font-bold text-brand-secondary focus:outline-none focus:border-brand-primary disabled:opacity-50"
                    >
                      <option value="" disabled>Selecciona el corte...</option>
                      <option
                        v-for="y in (activeBatch?.yields || [])"
                        :key="y.id"
                        :value="y.id"
                      >
                        {{ y.size_name }} (S/ {{ y.unit_cost.toFixed(2) }}/u)
                      </option>
                    </select>
                  </div>

                  <!-- Piezas Contenidas -->
                  <div class="sm:col-span-3">
                    <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
                      Piezas en el Producto
                    </label>
                    <div class="flex items-center gap-1.5">
                      <input
                        v-model="unitsContained"
                        type="number"
                        min="1"
                        placeholder="1"
                        class="w-full px-3 py-2 bg-white rounded-xl border border-brand-primary/20 text-xs font-black text-center text-brand-secondary focus:outline-none focus:border-brand-primary"
                      />
                      <span class="text-xs font-bold text-brand-primary/70 shrink-0">u</span>
                    </div>
                  </div>
                </div>

                <!-- Resumen de Costo de Masa -->
                <div v-if="activeYield" class="pt-2 border-t border-brand-primary/10 flex items-center justify-between text-xs">
                  <span class="text-brand-primary font-medium">
                    {{ unitsContained }} {{ activeYield.size_name }} &times; S/ {{ activeYield.unit_cost.toFixed(2) }}
                  </span>
                  <span class="font-bold text-brand-secondary">
                    Subtotal Masa: S/ {{ doughCost.toFixed(2) }}
                  </span>
                </div>
              </div>

              <!-- Sección 2: Empaques Directos -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:package" class="w-4 h-4 text-brand-primary" />
                    <div>
                      <span class="text-xs font-bold text-brand-secondary uppercase tracking-wider">
                        2. Empaques Directos de Presentación
                      </span>
                      <p class="text-[10px] text-brand-primary/70">
                        Cajas, etiquetas, cintas, papel encerado o bolsas que acompañan la venta
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="addPackaging"
                    class="px-2.5 py-1 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                    <span>Agregar Empaque</span>
                  </button>
                </div>

                <div v-if="packagingItems.length === 0" class="p-3 bg-brand-cream/20 rounded-xl text-center text-xs text-brand-primary/70">
                  Sin empaques asignados. Haz clic en "Agregar Empaque" para incluir caja, cinta o etiqueta.
                </div>

                <div v-else class="space-y-2">
                  <div
                    v-for="(pkg, index) in packagingItems"
                    :key="index"
                    class="p-2.5 bg-brand-cream/20 rounded-xl border border-brand-primary/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <!-- Selector de Insumo Empaque -->
                    <div class="flex-1 min-w-0">
                      <select
                        v-model="pkg.raw_material_id"
                        class="w-full px-2.5 py-1.5 bg-white rounded-lg border border-brand-primary/20 text-xs font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                      >
                        <option value="" disabled>Selecciona un empaque...</option>
                        <option
                          v-for="mat in sortedMaterials"
                          :key="mat.id"
                          :value="mat.id"
                        >
                          {{ mat.name }} ({{ mat.unit }}) — S/ {{ Number(mat.purchase_price).toFixed(2) }}
                        </option>
                      </select>
                    </div>

                    <!-- Cantidad de Empaque -->
                    <div class="w-28 flex items-center gap-1 shrink-0">
                      <input
                        v-model="pkg.quantity_used"
                        type="number"
                        step="0.1"
                        min="0.01"
                        placeholder="1"
                        class="w-full px-2 py-1.5 bg-white rounded-lg border border-brand-primary/20 text-xs font-bold text-center text-brand-secondary focus:outline-none focus:border-brand-primary"
                      />
                      <span class="text-[10px] font-bold text-brand-primary/70 shrink-0">
                        {{ getMaterial(pkg.raw_material_id)?.unit || 'u' }}
                      </span>
                    </div>

                    <!-- Subtotal Costo Empaque -->
                    <div class="w-20 text-right shrink-0">
                      <span class="text-xs font-bold text-brand-secondary">
                        S/ {{ getPkgCost(pkg).toFixed(2) }}
                      </span>
                    </div>

                    <!-- Eliminar -->
                    <button
                      type="button"
                      @click="removePackaging(index)"
                      class="text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"
                    >
                      <Icon name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tarjeta de Rentabilidad y Margen Comercial -->
              <div class="bg-[#4A5D23] p-4 sm:p-5 rounded-2xl text-[#F4F1E1] shadow-lg relative overflow-hidden">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
                  <div>
                    <span class="text-[9px] font-bold uppercase tracking-wider text-[#F4F1E1]/70 block">Costo Masa</span>
                    <span class="text-lg font-bold">S/ {{ doughCost.toFixed(2) }}</span>
                  </div>
                  <div>
                    <span class="text-[9px] font-bold uppercase tracking-wider text-[#F4F1E1]/70 block">Costo Empaques</span>
                    <span class="text-lg font-bold">S/ {{ packagingTotalCost.toFixed(2) }}</span>
                  </div>
                  <div>
                    <span class="text-[9px] font-bold uppercase tracking-wider text-[#F4F1E1]/70 block">Costo Producción</span>
                    <span class="text-xl font-black text-white">S/ {{ totalProductionCost.toFixed(2) }}</span>
                  </div>
                  <div class="border-t sm:border-t-0 sm:border-l sm:border-white/20 sm:pl-3 pt-2 sm:pt-0 col-span-2 sm:col-span-1">
                    <span class="text-[9px] font-bold uppercase tracking-wider text-[#F4F1E1]/70 block">Margen Comercial</span>
                    <div class="flex items-baseline gap-1">
                      <span class="text-xl font-black" :class="margins.marginPercent >= 40 ? 'text-lime-300' : (margins.marginPercent >= 20 ? 'text-amber-300' : 'text-red-300')">
                        {{ margins.marginPercent }}%
                      </span>
                      <span class="text-[10px] text-white/80 font-bold">
                        (S/ {{ margins.marginSoles.toFixed(2) }})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer con Acciones -->
          <div class="px-5 py-3.5 sm:px-6 sm:py-4 bg-brand-cream/30 border-t border-brand-primary/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-cream/80 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="handleSave"
              :disabled="isSubmitting || isLoading || !selectedYieldId"
              class="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-[#3C4A1C] shadow-soft-sm active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:check" class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Guardando Composición...' : 'Guardar Composición' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
