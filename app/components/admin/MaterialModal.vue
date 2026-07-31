<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  show: boolean;
  materialToEdit?: any | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const newMaterial = ref({
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
          name: props.materialToEdit.name,
          unit: props.materialToEdit.unit,
          purchase_price: props.materialToEdit.purchase_price,
          purchase_quantity: props.materialToEdit.purchase_quantity,
          stock: props.materialToEdit.stock,
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

function closeModal() {
  emit("close");
}

async function saveMaterial() {
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
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || "Error al guardar insumo.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
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
        class="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop border border-[#4A5D23]/10 max-h-[85vh] flex flex-col"
      >
        <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-playfair font-black text-[#2A321B]">
              {{ materialToEdit ? "Editar Insumo" : "Nuevo Insumo" }}
            </h3>
            <button
              @click="closeModal"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm"
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
                >Nombre del Insumo</label
              >
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
                  >Precio de Compra</label
                >
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D23]/50 font-black text-sm"
                    >S/</span
                  >
                  <input
                    v-model="newMaterial.purchase_price"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    class="w-full pl-8 pr-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30 [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                  >Unidad de Medida</label
                >
                <select
                  v-model="newMaterial.unit"
                  class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all appearance-none"
                >
                  <option value="g">Gramos (g)</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="l">Litros (l)</option>
                  <option value="und">Unidades (und)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                  >Cantidad que trae</label
                >
                <input
                  v-model="newMaterial.purchase_quantity"
                  type="number"
                  step="any"
                  required
                  :placeholder="newMaterial.unit === 'g' ? 'Ej: 1000' : 'Ej: 1'"
                  class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30 [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5"
                  >Stock Actual ({{ newMaterial.unit }})</label
                >
                <input
                  v-model="newMaterial.stock"
                  type="number"
                  step="any"
                  placeholder="0"
                  class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30 [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full bg-[#4A5D23] border border-transparent text-white font-bold py-3 rounded-xl mt-4 shadow-sm transition-all duration-300 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#3C4A1C] text-sm"
            >
              <Icon
                v-if="isSubmitting"
                name="lucide:loader-2"
                class="w-4 h-4 animate-spin"
              />
              {{
                isSubmitting
                  ? "Guardando..."
                  : materialToEdit
                    ? "Guardar Cambios"
                    : "Registrar Insumo"
              }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes pop {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
