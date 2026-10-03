<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { RawMaterialRow, BaseUnit, MaterialType } from "~/types/inventory";

const props = withDefaults(
  defineProps<{
    show: boolean;
    materialToEdit?: RawMaterialRow | null;
    defaultType?: MaterialType;
  }>(),
  {
    defaultType: "ingredient",
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const newMaterial = ref<{
  name: string;
  unit: BaseUnit | string;
  purchase_price: number | string;
  purchase_quantity: number | string;
  stock: number | string;
  type: MaterialType;
}>({
  name: "",
  unit: "g",
  purchase_price: "",
  purchase_quantity: "",
  stock: "",
  type: "ingredient",
});

const ingredientUnits = [
  { label: "Gramos (g)", value: "g" },
  { label: "Mililitros (ml)", value: "ml" },
  { label: "Unidades (und)", value: "und" },
  { label: "Kilogramos (kg)", value: "kg" },
  { label: "Litros (L)", value: "L" },
];

const packagingUnits = [
  { label: "Unidades / Piezas (und)", value: "und" },
  { label: "Paquete (paq)", value: "paq" },
  { label: "Ciento (cto)", value: "cto" },
  { label: "Millar (mil)", value: "mil" },
  { label: "Metros (m)", value: "m" },
  { label: "Rollo (rollo)", value: "rollo" },
];

const unitOptions = computed(() => {
  return newMaterial.value.type === "packaging" ? packagingUnits : ingredientUnits;
});

function changeType(type: MaterialType) {
  newMaterial.value.type = type;
  if (type === "packaging") {
    if (["g", "kg", "ml", "L"].includes(newMaterial.value.unit)) {
      newMaterial.value.unit = "und";
    }
  } else {
    if (["paq", "cto", "mil", "rollo", "m"].includes(newMaterial.value.unit)) {
      newMaterial.value.unit = "g";
    }
  }
}

const isSubmitting = ref(false);
const errorMessage = ref("");

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.materialToEdit) {
        const editType = (props.materialToEdit.type as MaterialType) || "ingredient";
        newMaterial.value = {
          name: props.materialToEdit.name || "",
          unit: (props.materialToEdit.unit as BaseUnit) || (editType === "packaging" ? "und" : "g"),
          purchase_price: props.materialToEdit.purchase_price ?? "",
          purchase_quantity: props.materialToEdit.purchase_quantity ?? "",
          stock: props.materialToEdit.stock ?? "",
          type: editType,
        };
      } else {
        const initialType = props.defaultType || "ingredient";
        newMaterial.value = {
          name: "",
          unit: initialType === "packaging" ? "und" : "g",
          purchase_price: "",
          purchase_quantity: "",
          stock: "",
          type: initialType,
        };
      }
      errorMessage.value = "";
    }
  },
);

function closeModal(): void {
  emit("close");
}

async function saveMaterial(): Promise<void> {
  if (
    !newMaterial.value.name ||
    !newMaterial.value.purchase_price ||
    !newMaterial.value.purchase_quantity
  ) {
    errorMessage.value = "Completa el precio y la cantidad del paquete.";
    return;
  }
  isSubmitting.value = true;
  errorMessage.value = "";
  try {
    const method = props.materialToEdit ? "PUT" : "POST";
    const endpoint = props.materialToEdit
      ? `/api/raw-materials/${props.materialToEdit.id}`
      : "/api/raw-materials";

    await $fetch(endpoint, {
      method,
      body: {
        name: newMaterial.value.name,
        unit: newMaterial.value.unit,
        purchase_price: Number(newMaterial.value.purchase_price),
        purchase_quantity: Number(newMaterial.value.purchase_quantity),
        stock: Number(newMaterial.value.stock || 0),
        type: newMaterial.value.type,
      },
    });

    emit("saved");
    closeModal();
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = fetchErr.data?.statusMessage || fetchErr.message || "Error al guardar insumo.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <ClientOnly>
    <Teleport to="#admin-modal-portal">
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar pointer-events-auto"
      >
        <div
          class="fixed inset-0 bg-[#2A321B]/50 backdrop-blur-sm transition-opacity"
          @click="closeModal"
        ></div>

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-material-title"
          class="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop border border-[#4A5D23]/10 max-h-[85vh] flex flex-col"
        >
          <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#4A5D23]/10 text-[#4A5D23] flex items-center justify-center">
                  <Icon :name="newMaterial.type === 'packaging' ? 'lucide:package' : 'lucide:wheat'" class="w-4 h-4" />
                </div>
                <h3 id="modal-material-title" class="text-lg sm:text-xl font-playfair font-black text-[#2A321B]">
                  {{ materialToEdit ? (newMaterial.type === 'packaging' ? 'Editar Empaque' : 'Editar Insumo') : (newMaterial.type === 'packaging' ? 'Nuevo Empaque' : 'Nuevo Insumo') }}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar modal de insumo"
                @click="closeModal"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>

            <!-- Selector de Tipo: Ingrediente vs Empaque / Presentación -->
            <div class="mb-5 p-1 bg-[#F4F1E1]/60 rounded-2xl border border-[#4A5D23]/15 flex gap-1">
              <button
                type="button"
                @click="changeType('ingredient')"
                :class="[
                  'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  newMaterial.type === 'ingredient'
                    ? 'bg-[#4A5D23] text-white shadow-xs'
                    : 'text-[#4A5D23]/70 hover:text-[#2A321B] hover:bg-white/50'
                ]"
              >
                <Icon name="lucide:wheat" class="w-3.5 h-3.5" />
                <span>Ingrediente</span>
              </button>
              <button
                type="button"
                @click="changeType('packaging')"
                :class="[
                  'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  newMaterial.type === 'packaging'
                    ? 'bg-[#4A5D23] text-white shadow-xs'
                    : 'text-[#4A5D23]/70 hover:text-[#2A321B] hover:bg-white/50'
                ]"
              >
                <Icon name="lucide:package" class="w-3.5 h-3.5" />
                <span>Empaque</span>
              </button>
            </div>

            <div
              v-if="errorMessage"
              class="mb-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm flex items-start gap-2"
            >
              <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{{ errorMessage }}</span>
            </div>

            <form @submit.prevent="saveMaterial" class="space-y-4">
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                >
                  {{ newMaterial.type === 'packaging' ? 'Nombre del Empaque / Presentación' : 'Nombre del Insumo' }}
                </label>
                <input
                  v-model="newMaterial.name"
                  type="text"
                  required
                  :placeholder="newMaterial.type === 'packaging' ? 'Ej: Caja Torta 25x25cm, Bolsa Kraft...' : 'Ej: Harina sin preparar, Azúcar rubia...'"
                  class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                  >Precio de Compra</label>
                  <div class="relative">
                    <span
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#4A5D23]/40"
                    >S/</span>
                    <input
                      v-model="newMaterial.purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      class="w-full pl-8 pr-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30"
                    />
                  </div>
                </div>

                <div>
                  <label
                    class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5 truncate"
                  >
                    {{ newMaterial.type === 'packaging' ? 'Cant. por Paquete' : 'Cantidad Paquete' }}
                  </label>
                  <input
                    v-model="newMaterial.purchase_quantity"
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    :placeholder="newMaterial.type === 'packaging' ? 'Ej: 10, 25, 100' : 'Ej: 5000'"
                    class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                  >Unidad Base</label>
                  <CustomSelect
                    v-model="newMaterial.unit"
                    :options="unitOptions"
                    placeholder="Unidad..."
                    bgClass="bg-[#F4F1E1]/30"
                    size="sm"
                    class="w-full text-xs font-bold"
                  />
                </div>

                <div>
                  <label
                    class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                  >Stock Actual</label>
                  <input
                    v-model="newMaterial.stock"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30"
                  />
                </div>
              </div>

              <div class="pt-4 flex justify-end gap-3 border-t border-[#4A5D23]/10">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-5 py-2.5 rounded-xl border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="px-6 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Icon
                    v-if="isSubmitting"
                    name="lucide:loader-2"
                    class="w-4 h-4 animate-spin"
                  />
                  <span>{{
                    isSubmitting
                      ? "Guardando..."
                      : materialToEdit
                        ? "Actualizar"
                        : (newMaterial.type === 'packaging' ? 'Crear Empaque' : 'Crear Insumo')
                  }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
