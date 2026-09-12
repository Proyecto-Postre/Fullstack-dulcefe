<script setup lang="ts">
import { ref, watch } from "vue";
import type { RawMaterialRow, BaseUnit } from "~/types/inventory";

const props = defineProps<{
  show: boolean;
  materialToEdit?: RawMaterialRow | null;
}>();

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
}>({
  name: "",
  unit: "g",
  purchase_price: "",
  purchase_quantity: "",
  stock: "",
});

const isSubmitting = ref(false);
const errorMessage = ref("");

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.materialToEdit) {
        newMaterial.value = {
          name: props.materialToEdit.name || "",
          unit: (props.materialToEdit.unit as BaseUnit) || "g",
          purchase_price: props.materialToEdit.purchase_price ?? "",
          purchase_quantity: props.materialToEdit.purchase_quantity ?? "",
          stock: props.materialToEdit.stock ?? "",
        };
      } else {
        newMaterial.value = {
          name: "",
          unit: "g",
          purchase_price: "",
          purchase_quantity: "",
          stock: "",
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
        class="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar pointer-events-auto"
      >
        <div
          class="absolute inset-0 bg-[#2A321B]/40 backdrop-blur-sm"
          @click="closeModal"
        ></div>

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-material-title"
          class="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop border border-[#4A5D23]/10 max-h-[85vh] flex flex-col"
        >
          <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            <div class="flex items-center justify-between mb-6">
              <h3 id="modal-material-title" class="text-xl font-playfair font-black text-[#2A321B]">
                {{ materialToEdit ? "Editar Insumo" : "Nuevo Insumo" }}
              </h3>
              <button
                type="button"
                aria-label="Cerrar modal de insumo"
                @click="closeModal"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>

            <div
              v-if="errorMessage"
              class="mb-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm flex items-start gap-2"
            >
              <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{{ errorMessage }}</span>
            </div>

            <form @submit.prevent="saveMaterial" class="space-y-5">
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                >Nombre del Insumo</label>
                <input
                  v-model="newMaterial.name"
                  type="text"
                  required
                  placeholder="Ej: Harina sin preparar"
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
                    class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                  >Cantidad Paquete</label>
                  <input
                    v-model="newMaterial.purchase_quantity"
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    placeholder="Ej: 5000"
                    class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                  >Unidad Base</label>
                  <select
                    v-model="newMaterial.unit"
                    class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all"
                  >
                    <option value="g">Gramos (g)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="und">Unidades (und)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="L">Litros (L)</option>
                  </select>
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
                  class="px-5 py-2.5 rounded-xl border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="px-6 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm flex items-center gap-2"
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
                        : "Crear Insumo"
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
