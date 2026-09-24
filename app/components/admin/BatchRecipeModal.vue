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
const hasSubmitted = ref(false)

// Reinicializar formulario al abrir modal o cambiar batchToEdit
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      errorMessage.value = ''
      hasSubmitted.value = false
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
  hasSubmitted.value = true
  errorMessage.value = ''

  if (!name.value.trim()) {
    errorMessage.value = 'Por favor completa los campos obligatorios marcados en rojo (Nombre de la tanda).'
    toast.error('Faltan campos obligatorios', { description: 'Ingresa el nombre de la tanda maestra.' })
    return
  }

  const hasIncompleteItems = items.value.some(
    (it) => it.raw_material_id === '' || !it.quantity_used || Number(it.quantity_used) <= 0
  )
  if (hasIncompleteItems || items.value.length === 0) {
    errorMessage.value = 'Completa los insumos marcados en rojo: selecciona el ingrediente e ingresa una cantidad mayor a 0.'
    toast.error('Insumos incompletos', { description: 'Verifica los insumos resaltados en rojo.' })
    return
  }

  const hasIncompleteYields = yields.value.some(
    (y) => !y.size_name.trim() || !y.yield_units || Number(y.yield_units) <= 0
  )
  if (hasIncompleteYields || yields.value.length === 0) {
    errorMessage.value = 'Completa los formatos de corte marcados en rojo: ingresa el nombre del tamaño y rendimiento mayor a 0.'
    toast.error('Cortes incompletos', { description: 'Verifica los formatos de corte resaltados en rojo.' })
    return
  }

  const validItems = items.value.filter(
    (it) => it.raw_material_id !== '' && Number(it.quantity_used) > 0
  )
  const validYields = yields.value.filter(
    (y) => y.size_name.trim() !== '' && Number(y.yield_units) > 0
  )

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
    toast.error('Error al guardar', { description: errorMessage.value })
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
          <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-brand-primary/10 flex items-center sm:items-start justify-between gap-3 bg-gradient-to-r from-surface via-surface to-brand-cream/30 shrink-0">
            <div class="flex items-center sm:items-start gap-2.5 sm:gap-3.5 min-w-0">
              <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 shadow-2xs sm:mt-0.5">
                <Icon name="lucide:chef-hat" class="w-4 h-4 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <div class="min-w-0">
                <h3 id="modal-batch-title" class="text-sm sm:text-base lg:text-xl font-playfair font-bold text-brand-secondary leading-snug">
                  {{ batchToEdit ? 'Editar Tanda Maestra' : 'Nueva Tanda Maestra' }}
                </h3>
                <p class="hidden sm:block text-xs text-brand-primary/80 font-medium leading-relaxed mt-0.5">
                  Configura los ingredientes de la receta de taller y los formatos de corte
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar modal"
              @click="closeModal"
              class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white border border-brand-primary/20 text-brand-secondary hover:bg-brand-cream hover:text-brand-primary hover:border-brand-primary/40 active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer sm:mt-0.5"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Body Scrollable -->
          <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            <form @submit.prevent="handleSubmit" id="batch-form" novalidate class="space-y-6">
              <!-- Datos Principales -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div class="sm:col-span-8">
                  <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1.5">
                    Nombre de la Tanda Maestra *
                  </label>
                  <input
                    v-model="name"
                    type="text"
                    placeholder="Ej: Masa Brioche Clásica para Roles"
                    :class="[
                      'w-full px-3.5 py-2.5 bg-brand-cream/40 rounded-xl border focus:outline-none focus:bg-white text-xs sm:text-sm font-bold text-brand-secondary shadow-sm transition-all',
                      hasSubmitted && !name.trim()
                        ? 'border-red-400 focus:border-red-500 ring-2 ring-red-400/20 bg-red-50/15'
                        : 'border-brand-primary/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10'
                    ]"
                  />
                  <p v-if="hasSubmitted && !name.trim()" class="text-[10px] text-red-500 font-bold mt-1">
                    * Ingresa el nombre de la tanda maestra
                  </p>
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
                        step="any"
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
                        step="any"
                        min="0"
                        placeholder="0.00"
                        class="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-brand-primary/20 text-xs sm:text-sm font-bold text-brand-secondary focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sección Insumos de la Tanda -->
              <div class="space-y-3 relative z-20">
                <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-brand-primary/10">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Icon name="lucide:scale" class="w-4 h-4" />
                    </div>
                    <div class="flex items-center gap-1.5 min-w-0">
                      <span class="text-xs sm:text-sm font-bold text-brand-secondary whitespace-nowrap">
                        Insumos de la Receta
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary whitespace-nowrap shrink-0">
                        {{ items.length }} {{ items.length === 1 ? 'insumo' : 'insumos' }}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="addItem"
                    class="h-8 px-2.5 sm:px-3 bg-brand-primary text-white hover:bg-[#3C4A1C] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                    <span class="sm:hidden">Insumo</span>
                    <span class="hidden sm:inline">Agregar Insumo</span>
                  </button>
                </div>

                <div class="space-y-2.5">
                  <div
                    v-for="(item, index) in items"
                    :key="index"
                    :style="{ zIndex: items.length - index + 10 }"
                    class="relative p-2.5 sm:p-3 bg-brand-cream/30 rounded-xl border border-brand-primary/15 flex flex-col sm:flex-row sm:items-center gap-2.5 shadow-soft-sm"
                  >
                    <!-- Selector de Insumo con CustomSelect -->
                    <div class="flex-1 min-w-0">
                      <CustomSelect
                        v-model="item.raw_material_id"
                        :options="materialOptions"
                        placeholder="Selecciona un insumo..."
                        size="sm"
                        bgClass="bg-white"
                        :buttonClass="hasSubmitted && !item.raw_material_id ? 'border-red-400 ring-2 ring-red-400/20 bg-red-50/15' : ''"
                      />
                    </div>

                    <!-- Cantidad Usada, Costo y Eliminar en fila responsive -->
                    <div class="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-brand-primary/10">
                      <div class="w-28 sm:w-32 flex items-center gap-1.5">
                        <input
                          v-model="item.quantity_used"
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Cantidad"
                          :class="[
                            'w-full px-2.5 py-1.5 bg-white rounded-lg border text-xs font-bold text-brand-secondary text-right focus:outline-none shadow-soft-sm transition-all',
                            hasSubmitted && (!item.quantity_used || Number(item.quantity_used) <= 0)
                              ? 'border-red-400 focus:border-red-500 ring-2 ring-red-400/20 bg-red-50/15'
                              : 'border-brand-primary/20 focus:border-brand-primary'
                          ]"
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
              <div class="space-y-3 relative z-10">
                <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-brand-primary/10">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Icon name="lucide:scissors" class="w-4 h-4" />
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="text-xs sm:text-sm font-bold text-brand-secondary whitespace-nowrap">
                          Formatos de Corte
                        </span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary whitespace-nowrap shrink-0">
                          {{ yields.length }} {{ yields.length === 1 ? 'corte' : 'cortes' }}
                        </span>
                      </div>
                      <p class="hidden sm:block text-[10px] text-brand-primary/70 truncate">
                        Piezas que rinde la tanda completa según porcionamiento
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="addYield"
                    class="h-8 px-2.5 sm:px-3 bg-brand-primary text-white hover:bg-[#3C4A1C] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                    <span class="sm:hidden">Corte</span>
                    <span class="hidden sm:inline">Agregar Corte</span>
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
                        :class="[
                          'w-full px-2.5 py-1.5 bg-white rounded-lg border text-xs font-bold text-brand-secondary focus:outline-none transition-all',
                          hasSubmitted && !y.size_name.trim()
                            ? 'border-red-400 focus:border-red-500 ring-2 ring-red-400/20 bg-red-50/15'
                            : 'border-brand-primary/20 focus:border-brand-primary'
                        ]"
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
                          step="1"
                          min="1"
                          placeholder="12"
                          :class="[
                            'w-20 px-2 py-1 bg-white rounded-lg border text-xs font-bold text-center text-brand-secondary focus:outline-none transition-all',
                            hasSubmitted && (!y.yield_units || Number(y.yield_units) <= 0)
                              ? 'border-red-400 focus:border-red-500 ring-2 ring-red-400/20 bg-red-50/15'
                              : 'border-brand-primary/20 focus:border-brand-primary'
                          ]"
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

              <!-- Tarjeta KPI de Costeo en Tiempo Real (Compacto y Responsive) -->
              <div class="bg-[#4A5D23] p-3 sm:p-4 rounded-2xl text-[#F4F1E1] shadow-lg relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 pointer-events-none">
                  <Icon name="lucide:calculator" class="w-full h-full text-white" />
                </div>
                <div class="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 text-center items-center divide-x divide-white/15">
                  <div class="px-1">
                    <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#F4F1E1]/80 block">
                      Insumos
                    </span>
                    <span class="text-xs sm:text-base font-bold font-inter block mt-0.5">
                      S/ {{ liveSummary.materialsCost.toFixed(2) }}
                    </span>
                  </div>
                  <div class="px-1">
                    <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#F4F1E1]/80 block">
                      Costos CIF
                    </span>
                    <span class="text-xs sm:text-base font-bold font-inter block mt-0.5">
                      S/ {{ liveSummary.cifCost.toFixed(2) }}
                    </span>
                  </div>
                  <div class="px-1">
                    <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white block">
                      Total Tanda
                    </span>
                    <span class="text-sm sm:text-xl font-black font-inter tracking-tight text-white block mt-0.5">
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
