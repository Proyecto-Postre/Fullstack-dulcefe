<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { BaseRecipeDetail, BaseRecipeInput } from '~/types/batch-recipe'
import type { RawMaterialRow } from '~/types/inventory'
import { calculateLiveBatchCost } from '~/composables/admin/useAdminBatchRecipes'
import CustomSelect from '~/components/CustomSelect.vue'

interface FormItem {
  raw_material_id: number | ''
  quantity_used: number | ''
}

interface FormYield {
  size_name: string
  yield_units: number | ''
}

const props = defineProps<{
  show: boolean
  batchToEdit?: BaseRecipeDetail | null
  materials: RawMaterialRow[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', batch: BaseRecipeDetail): void
}>()

const name = ref('')
const description = ref('')
const laborCost = ref<number | ''>(0)
const utilitiesCost = ref<number | ''>(0)

const items = ref<FormItem[]>([])
const yields = ref<FormYield[]>([])

const isSubmitting = ref(false)
const errorMessage = ref('')

// Reinicializar formulario al abrir modal o cambiar batchToEdit
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      errorMessage.value = ''
      if (props.batchToEdit) {
        name.value = props.batchToEdit.name || ''
        description.value = props.batchToEdit.description || ''
        laborCost.value = props.batchToEdit.labor_cost ?? 0
        utilitiesCost.value = props.batchToEdit.utilities_cost ?? 0
        items.value = (props.batchToEdit.items || []).map((it) => ({
          raw_material_id: it.raw_material_id,
          quantity_used: it.quantity_used
        }))
        yields.value = (props.batchToEdit.yields || []).map((y) => ({
          size_name: y.size_name,
          yield_units: y.yield_units
        }))
      } else {
        name.value = ''
        description.value = ''
        laborCost.value = 0
        utilitiesCost.value = 0
        items.value = [{ raw_material_id: '', quantity_used: '' }]
        yields.value = [
          { size_name: 'Grande', yield_units: 12 },
          { size_name: 'Mediano', yield_units: 18 }
        ]
      }
    }
  }
)

// Insumos disponibles ordenados alfabéticamente
const sortedMaterials = computed(() => {
  return [...props.materials].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

const materialOptions = computed(() => {
  return sortedMaterials.value.map((mat) => ({
    label: mat.name || 'Insumo',
    sublabel: `${mat.unit} — S/ ${Number(mat.purchase_price).toFixed(2)} por ${mat.purchase_quantity}${mat.unit}`,
    value: mat.id
  }))
})

function getMaterial(id: number | '') {
  if (!id) return null
  return props.materials.find((m) => m.id === Number(id)) || null
}

function getItemCost(item: FormItem): number {
  const mat = getMaterial(item.raw_material_id)
  if (!mat || !item.quantity_used) return 0
  const price = Number(mat.purchase_price) || 0
  const purchaseQty = Number(mat.purchase_quantity) || 1
  return Number(((price / purchaseQty) * Number(item.quantity_used)).toFixed(2))
}

// Resumen en vivo de costeo
const liveSummary = computed(() => {
  return calculateLiveBatchCost(
    items.value,
    props.materials,
    laborCost.value,
    utilitiesCost.value,
    yields.value
  )
})

function addItem() {
  items.value.push({ raw_material_id: '', quantity_used: '' })
}

function removeItem(index: number) {
  if (items.value.length > 1) {
    items.value.splice(index, 1)
  } else {
    items.value[0] = { raw_material_id: '', quantity_used: '' }
  }
}

function addYield() {
  yields.value.push({ size_name: '', yield_units: 1 })
}

function removeYield(index: number) {
  if (yields.value.length > 1) {
    yields.value.splice(index, 1)
  }
}

function closeModal() {
  emit('close')
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!name.value.trim()) {
    errorMessage.value = 'Ingresa el nombre de la tanda maestra.'
    return
  }

  const validItems = items.value.filter(
    (it) => it.raw_material_id !== '' && Number(it.quantity_used) > 0
  )
  if (validItems.length === 0) {
    errorMessage.value = 'Agrega al menos un ingrediente con cantidad válida mayor a 0.'
    return
  }

  const validYields = yields.value.filter(
    (y) => y.size_name.trim() !== '' && Number(y.yield_units) > 0
  )
  if (validYields.length === 0) {
    errorMessage.value = 'Define al menos un corte o tamaño con rendimiento mayor a 0.'
    return
  }

  isSubmitting.value = true
  try {
    const payload: BaseRecipeInput = {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      labor_cost: Number(laborCost.value) || 0,
      utilities_cost: Number(utilitiesCost.value) || 0,
      items: validItems.map((it) => ({
        raw_material_id: Number(it.raw_material_id),
        quantity_used: Number(it.quantity_used)
      })),
      yields: validYields.map((y) => ({
        size_name: y.size_name.trim(),
        yield_units: Number(y.yield_units)
      }))
    }

    const endpoint = props.batchToEdit
      ? `/api/admin/batch-recipes/${props.batchToEdit.id}`
      : '/api/admin/batch-recipes'
    const method = props.batchToEdit ? 'PUT' : 'POST'

    const res = await $fetch<{ success: boolean; data: BaseRecipeDetail }>(endpoint, {
      method,
      body: payload
    })

    if (res?.success && res.data) {
      toast.success(
        props.batchToEdit
          ? 'Tanda maestra actualizada con éxito'
          : 'Nueva tanda maestra registrada con éxito'
      )
      emit('saved', res.data)
      closeModal()
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string; error?: { message?: string } }; message?: string }
    errorMessage.value =
      fetchErr.data?.error?.message ||
      fetchErr.data?.statusMessage ||
      fetchErr.message ||
      'Error al guardar la tanda maestra.'
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
          aria-labelledby="modal-batch-title"
          class="relative w-full max-w-4xl bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl overflow-hidden animate-pop border border-[#4A5D23]/10 max-h-[92vh] flex flex-col z-10"
        >
          <!-- Header -->
          <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-brand-primary/10 flex items-center justify-between bg-surface shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <Icon name="lucide:chef-hat" class="w-5 h-5" />
              </div>
              <div>
                <h3 id="modal-batch-title" class="text-lg sm:text-xl font-playfair font-black text-brand-secondary">
                  {{ batchToEdit ? 'Editar Tanda Maestra' : 'Nueva Tanda Maestra / Masa Base' }}
                </h3>
                <p class="text-xs text-brand-primary/80 font-medium">
                  Configura los ingredientes de la receta de taller y los formatos de corte
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
          <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            <!-- Error Banner -->
            <div
              v-if="errorMessage"
              class="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-start gap-2.5"
            >
              <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{{ errorMessage }}</span>
            </div>

            <form @submit.prevent="handleSubmit" id="batch-form" class="space-y-6">
              <!-- Datos Principales -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div class="sm:col-span-8">
                  <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1.5">
                    Nombre de la Tanda Maestra *
                  </label>
                  <input
                    v-model="name"
                    type="text"
                    required
                    placeholder="Ej: Masa Brioche Clásica para Roles"
                    class="w-full px-3.5 py-2.5 bg-brand-cream/40 rounded-xl border border-brand-primary/20 focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 text-xs sm:text-sm font-bold text-brand-secondary shadow-sm transition-all"
                  />
                </div>
                <div class="sm:col-span-4">
                  <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1.5">
                    Descripción / Notas
                  </label>
                  <input
                    v-model="description"
                    type="text"
                    placeholder="Opcional: 1 kg de harina"
                    class="w-full px-3.5 py-2.5 bg-brand-cream/40 rounded-xl border border-brand-primary/20 focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 text-xs sm:text-sm text-brand-secondary shadow-sm transition-all"
                  />
                </div>
              </div>

              <!-- Costos Indirectos de Fabricación (CIF) -->
              <div class="p-4 bg-brand-cream/30 rounded-2xl border border-brand-primary/15">
                <div class="flex items-center gap-2 mb-3">
                  <Icon name="lucide:zap" class="w-4 h-4 text-brand-accent" />
                  <span class="text-xs font-bold text-brand-secondary uppercase tracking-wider">
                    Costos Indirectos de Fabricación (CIF) por Tanda
                  </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
                      Mano de Obra Directa (S/)
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary/50">S/</span>
                      <input
                        v-model="laborCost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        class="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-brand-primary/20 text-xs sm:text-sm font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
                      Servicios / Energía / Gas (S/)
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary/50">S/</span>
                      <input
                        v-model="utilitiesCost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        class="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-brand-primary/20 text-xs sm:text-sm font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sección Insumos de la Tanda -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:scale" class="w-4 h-4 text-brand-primary" />
                    <span class="text-xs font-bold text-brand-secondary uppercase tracking-wider">
                      Insumos de la Receta
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary">
                      {{ items.length }} {{ items.length === 1 ? 'insumo' : 'insumos' }}
                    </span>
                  </div>
                  <button
                    type="button"
                    @click="addItem"
                    class="px-2.5 py-1 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                    <span>Agregar Insumo</span>
                  </button>
                </div>

                <div class="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  <div
                    v-for="(item, index) in items"
                    :key="index"
                    class="p-2.5 sm:p-3 bg-brand-cream/30 rounded-xl border border-brand-primary/15 flex flex-col sm:flex-row sm:items-center gap-2.5 shadow-soft-sm"
                  >
                    <!-- Selector de Insumo con CustomSelect -->
                    <div class="flex-1 min-w-0">
                      <CustomSelect
                        v-model="item.raw_material_id"
                        :options="materialOptions"
                        placeholder="Selecciona un insumo..."
                        size="sm"
                        bgClass="bg-white"
                      />
                    </div>

                    <!-- Cantidad Usada, Costo y Eliminar en fila responsive -->
                    <div class="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-brand-primary/10">
                      <div class="w-28 sm:w-32 flex items-center gap-1.5">
                        <input
                          v-model="item.quantity_used"
                          type="number"
                          step="0.01"
                          min="0.001"
                          placeholder="Cantidad"
                          class="w-full px-2.5 py-1.5 bg-white rounded-lg border border-brand-primary/20 text-xs font-bold text-brand-secondary text-right focus:outline-none focus:border-brand-primary shadow-soft-sm"
                        />
                        <span class="text-[11px] font-bold text-brand-primary/70 shrink-0 w-8">
                          {{ getMaterial(item.raw_material_id)?.unit || 'u' }}
                        </span>
                      </div>

                      <div class="w-20 text-right">
                        <span class="text-xs font-black text-brand-secondary">
                          S/ {{ getItemCost(item).toFixed(2) }}
                        </span>
                      </div>

                      <button
                        type="button"
                        @click="removeItem(index)"
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors shrink-0 cursor-pointer"
                        title="Eliminar insumo"
                        aria-label="Eliminar insumo"
                      >
                        <Icon name="lucide:trash-2" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sección Rendimientos y Cortes -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:scissors" class="w-4 h-4 text-brand-primary" />
                    <div>
                      <span class="text-xs font-bold text-brand-secondary uppercase tracking-wider">
                        Rendimientos / Formatos de Corte
                      </span>
                      <p class="text-[10px] text-brand-primary/70">
                        ¿Cuántas piezas rinde la tanda completa según el tamaño de porcionamiento?
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="addYield"
                    class="px-2.5 py-1 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                    <span>Agregar Corte</span>
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="(y, index) in yields"
                    :key="index"
                    class="p-3 bg-brand-cream/40 rounded-xl border border-brand-primary/15 relative space-y-2"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <input
                        v-model="y.size_name"
                        type="text"
                        placeholder="Ej: Grande, Mediano, Mini"
                        class="w-full px-2.5 py-1.5 bg-white rounded-lg border border-brand-primary/20 text-xs font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                      />
                      <button
                        v-if="yields.length > 1"
                        type="button"
                        @click="removeYield(index)"
                        class="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Eliminar corte"
                      >
                        <Icon name="lucide:trash" class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 flex-1">
                        <label class="text-[10px] font-bold text-brand-primary/80 uppercase">Rinde:</label>
                        <input
                          v-model="y.yield_units"
                          type="number"
                          min="1"
                          placeholder="12"
                          class="w-20 px-2 py-1 bg-white rounded-lg border border-brand-primary/20 text-xs font-bold text-center text-brand-secondary focus:outline-none focus:border-brand-primary"
                        />
                        <span class="text-[10px] text-brand-primary/70 font-semibold">piezas</span>
                      </div>

                      <!-- Costo Unitario en Vivo -->
                      <div class="text-right">
                        <span class="text-[9px] text-brand-primary uppercase tracking-wider block font-bold">Costo Pieza</span>
                        <span class="text-xs sm:text-sm font-black text-brand-secondary">
                          S/ {{ (liveSummary.totalCost / Math.max(1, Number(y.yield_units) || 1)).toFixed(2) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tarjeta KPI de Costeo en Tiempo Real -->
              <div class="bg-[#4A5D23] p-4 sm:p-5 rounded-2xl text-[#F4F1E1] shadow-lg relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 pointer-events-none">
                  <Icon name="lucide:calculator" class="w-full h-full text-white" />
                </div>
                <div class="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left items-center">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-[#F4F1E1]/70 block">
                      Insumos Directos
                    </span>
                    <span class="text-xl font-bold font-inter">
                      S/ {{ liveSummary.materialsCost.toFixed(2) }}
                    </span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-[#F4F1E1]/70 block">
                      Costos Indirectos (CIF)
                    </span>
                    <span class="text-xl font-bold font-inter">
                      S/ {{ liveSummary.cifCost.toFixed(2) }}
                    </span>
                  </div>
                  <div class="sm:border-l sm:border-white/20 sm:pl-4">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-[#F4F1E1]/70 block">
                      Costo Total de Tanda
                    </span>
                    <span class="text-2xl sm:text-3xl font-black font-inter tracking-tight text-white">
                      S/ {{ liveSummary.totalCost.toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>
            </form>
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
              type="submit"
              form="batch-form"
              :disabled="isSubmitting"
              class="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-[#3C4A1C] shadow-soft-sm active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:check" class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Guardando Tanda...' : (batchToEdit ? 'Actualizar Tanda' : 'Guardar Tanda Maestra') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
