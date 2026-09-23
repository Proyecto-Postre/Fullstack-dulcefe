<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import type {
  BaseRecipeDetail,
  BatchWasteReason,
  QuickPieceDeductionResult
} from '~/types/batch-recipe'
import type { RawMaterialRow } from '~/types/inventory'
import { calculateProportionalPreview } from '~/composables/admin/useAdminBatchRecipes'
import CustomSelect from '~/components/CustomSelect.vue'

const props = defineProps<{
  show: boolean
  batchRecipes: BaseRecipeDetail[]
  materials: RawMaterialRow[]
  initialBatchId?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'deducted', result: QuickPieceDeductionResult): void
}>()

const selectedBatchId = ref<number | ''>('')
const selectedYieldId = ref<number | ''>('')
const piecesCount = ref<number>(1)
const reason = ref<BatchWasteReason>('personal_consumption')
const notes = ref<string>('')

const isSubmitting = ref(false)
const errorMessage = ref('')

const reasonOptions: Array<{ id: BatchWasteReason; label: string; icon: string; desc: string }> = [
  { id: 'personal_consumption', label: 'Consumo Taller', icon: 'lucide:coffee', desc: 'Desayuno o prueba del equipo' },
  { id: 'gift', label: 'Cortesía / Regalo', icon: 'lucide:gift', desc: 'Degustación o fidelización de cliente' },
  { id: 'spoilage', label: 'Merma o Calidad', icon: 'lucide:alert-triangle', desc: 'Pieza sobrecalentada o no apta' },
  { id: 'direct_sale', label: 'Venta Externa', icon: 'lucide:shopping-bag', desc: 'Venta en taller fuera de la web' }
]

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      errorMessage.value = ''
      piecesCount.value = 1
      reason.value = 'personal_consumption'
      notes.value = ''

      if (props.initialBatchId) {
        selectedBatchId.value = props.initialBatchId
      } else if (props.batchRecipes.length > 0 && props.batchRecipes[0]) {
        selectedBatchId.value = props.batchRecipes[0].id
      } else {
        selectedBatchId.value = ''
      }

      selectFirstYield()
    }
  }
)

watch(selectedBatchId, () => {
  selectFirstYield()
})

function selectFirstYield() {
  const currentBatch = activeBatch.value
  if (currentBatch && currentBatch.yields && currentBatch.yields.length > 0 && currentBatch.yields[0]) {
    selectedYieldId.value = currentBatch.yields[0].id ?? ''
  } else {
    selectedYieldId.value = ''
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

const batchOptions = computed(() => {
  return props.batchRecipes.map((b) => ({
    label: b.name,
    sublabel: `${b.items.length} insumos — Costo: S/ ${b.total_batch_cost.toFixed(2)}`,
    value: b.id
  }))
})

const yieldOptions = computed(() => {
  if (!activeBatch.value) return []
  return activeBatch.value.yields.map((y) => ({
    label: y.size_name,
    sublabel: `Rinde ${y.yield_units} piezas — S/ ${y.unit_cost.toFixed(2)}/u`,
    value: y.id
  }))
})

// Cálculo de previsualización en vivo de los insumos que se descontarán
const previewMaterials = computed(() => {
  if (!activeBatch.value || !selectedYieldId.value || piecesCount.value <= 0) return []
  return calculateProportionalPreview(
    activeBatch.value,
    Number(selectedYieldId.value),
    piecesCount.value
  )
})

function addPieces(amount: number) {
  piecesCount.value = Math.max(1, piecesCount.value + amount)
}

function closeModal() {
  emit('close')
}

async function handleConfirmDeduction() {
  errorMessage.value = ''

  if (!selectedYieldId.value) {
    errorMessage.value = 'Selecciona una tanda base y un corte de rendimiento.'
    return
  }
  if (!piecesCount.value || piecesCount.value <= 0) {
    errorMessage.value = 'Ingresa una cantidad de piezas válida mayor a 0.'
    return
  }

  isSubmitting.value = true
  try {
    const res = await $fetch<{ success: boolean; data: QuickPieceDeductionResult }>(
      '/api/admin/batch-recipes/quick-deduction',
      {
        method: 'POST',
        body: {
          recipe_yield_id: Number(selectedYieldId.value),
          pieces_count: Number(piecesCount.value),
          reason: reason.value,
          notes: notes.value.trim() || undefined
        }
      }
    )

    if (res?.success && res.data) {
      toast.success(
        `Descargo exitoso: Se descontaron materias primas equivalentes a ${piecesCount.value} ${res.data.yield_name}`
      )
      emit('deducted', res.data)
      closeModal()
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string; error?: { message?: string } }; message?: string }
    errorMessage.value =
      fetchErr.data?.error?.message ||
      fetchErr.data?.statusMessage ||
      fetchErr.message ||
      'Error al procesar el descargo de piezas.'
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
          aria-labelledby="modal-deduction-title"
          class="relative w-full max-w-2xl bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl overflow-hidden animate-pop border border-[#4A5D23]/10 max-h-[92vh] flex flex-col z-10"
        >
          <!-- Header -->
          <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-brand-primary/10 flex items-center justify-between bg-surface shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                <Icon name="lucide:minus-circle" class="w-5 h-5" />
              </div>
              <div>
                <h3 id="modal-deduction-title" class="text-lg sm:text-xl font-playfair font-black text-brand-secondary">
                  Descargo Rápido de Piezas Sueltas
                </h3>
                <p class="text-xs text-brand-primary/80 font-medium">
                  Descuenta insumos automáticamente del almacén sin necesidad de cálculos manuales
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
            <!-- Error Banner -->
            <div
              v-if="errorMessage"
              class="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-start gap-2.5"
            >
              <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Paso 1: Selección de Tanda y Formato -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1.5">
                  1. Tanda Base / Receta Maestra
                </label>
                <CustomSelect
                  v-model="selectedBatchId"
                  :options="batchOptions"
                  placeholder="Selecciona una tanda..."
                  size="sm"
                  bgClass="bg-white"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1.5">
                  2. Tamaño / Formato de Corte
                </label>
                <CustomSelect
                  v-model="selectedYieldId"
                  :options="yieldOptions"
                  :disabled="!activeBatch || yieldOptions.length === 0"
                  placeholder="Selecciona el corte..."
                  size="sm"
                  bgClass="bg-white"
                />
              </div>
            </div>

            <!-- Paso 2: Cantidad de Piezas -->
            <div class="p-4 bg-brand-cream/30 rounded-2xl border border-brand-primary/15 space-y-3">
              <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                3. Cantidad de Piezas a Descargar
              </label>
              <div class="flex items-center gap-3">
                <div class="relative w-28">
                  <input
                    v-model="piecesCount"
                    type="number"
                    min="1"
                    required
                    class="w-full px-3 py-2.5 bg-white rounded-xl border border-brand-primary/20 text-base font-black text-center text-brand-secondary focus:outline-none focus:border-brand-primary shadow-sm"
                  />
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    @click="addPieces(1)"
                    class="px-3 py-2 bg-white hover:bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-xs font-bold text-brand-primary transition-all cursor-pointer active:scale-95"
                  >
                    +1 pieza
                  </button>
                  <button
                    type="button"
                    @click="addPieces(2)"
                    class="px-3 py-2 bg-white hover:bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-xs font-bold text-brand-primary transition-all cursor-pointer active:scale-95"
                  >
                    +2 piezas
                  </button>
                  <button
                    type="button"
                    @click="addPieces(6)"
                    class="px-3 py-2 bg-white hover:bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-xs font-bold text-brand-primary transition-all cursor-pointer active:scale-95"
                  >
                    +6 (media docena)
                  </button>
                </div>
              </div>
            </div>

            <!-- Paso 3: Motivo del Descargo -->
            <div class="space-y-2">
              <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                4. Motivo del Descargo
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  v-for="opt in reasonOptions"
                  :key="opt.id"
                  type="button"
                  @click="reason = opt.id"
                  :class="[
                    'p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-98',
                    reason === opt.id
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-white hover:bg-brand-cream/50 text-brand-secondary border-brand-primary/15'
                  ]"
                >
                  <div class="flex items-center gap-1.5">
                    <Icon :name="opt.icon" class="w-3.5 h-3.5" />
                    <span class="text-xs font-bold truncate">{{ opt.label }}</span>
                  </div>
                  <span
                    :class="[
                      'text-[9px] line-clamp-1',
                      reason === opt.id ? 'text-white/80' : 'text-brand-primary/70'
                    ]"
                  >
                    {{ opt.desc }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Notas Opcionales -->
            <div>
              <label class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
                Detalles / Observaciones (Opcional)
              </label>
              <input
                v-model="notes"
                type="text"
                placeholder="Ej: Se probó horneado con 5 min adicionales"
                class="w-full px-3 py-2 bg-brand-cream/30 rounded-xl border border-brand-primary/20 text-xs text-brand-secondary focus:outline-none focus:border-brand-primary"
              />
            </div>

            <!-- Previsualización de Insumos Proporcionales que se descontarán -->
            <div
              v-if="previewMaterials.length > 0"
              class="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:check-check" class="w-4 h-4 text-amber-700" />
                  <span class="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Insumos exactos que se descontarán del almacén
                  </span>
                </div>
                <span class="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {{ ( (piecesCount / (activeYield?.yield_units || 1)) * 100 ).toFixed(1) }}% de la tanda
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <div
                  v-for="mat in previewMaterials"
                  :key="mat.raw_material_id"
                  class="bg-white/90 p-2 rounded-xl border border-amber-200/60 flex items-center justify-between gap-1 shadow-2xs"
                >
                  <span class="text-xs font-semibold text-brand-secondary truncate">
                    {{ mat.material_name }}
                  </span>
                  <span class="text-xs font-black text-amber-900 whitespace-nowrap">
                    -{{ mat.quantity_to_deduct }} {{ mat.unit }}
                  </span>
                </div>
              </div>

              <p class="text-[10px] text-amber-800/90 font-medium pt-1">
                🛡️ <strong>Garantía de Almacén:</strong> Solo se deducen las materias primas mostradas arriba. Las recetas y otros productos permanecen intactos.
              </p>
            </div>
          </div>

          <!-- Footer con Acciones -->
          <div class="px-4 py-3 sm:px-6 sm:py-4 bg-brand-cream/30 border-t border-brand-primary/10 flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-brand-secondary hover:bg-brand-cream/80 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="handleConfirmDeduction"
              :disabled="isSubmitting || !activeYield || piecesCount <= 0"
              class="flex-2 sm:flex-initial px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-soft-sm active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:check-circle" class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Descontando...' : `Confirmar Descargo de ${piecesCount} Piezas` }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
