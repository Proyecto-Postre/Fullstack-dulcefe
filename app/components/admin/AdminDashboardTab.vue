<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const props = defineProps<{
  catalog: any;
  materials: any;
}>();

// Computed properties for dashboard metrics
const totalProducts = computed(() => props.catalog?.data?.length || 0);
const totalMaterials = computed(() => props.materials?.data?.length || 0);

const lowStockProducts = computed(() => {
  if (!props.catalog?.data) return [];
  return props.catalog.data.filter((p: any) => p.stock <= 5);
});

const lowStockMaterials = computed(() => {
  if (!props.materials?.data) return [];
  // Assuming a threshold of 500g or 5 units for materials
  return props.materials.data.filter((m: any) => {
    if (m.unit === "g" || m.unit === "ml") return m.stock <= 500;
    return m.stock <= 5;
  });
});

const totalInventoryValue = computed(() => {
  if (!props.materials?.data) return 0;
  return props.materials.data.reduce((sum: number, m: any) => {
    const costPerUnit =
      m.cost_per_unit || m.purchase_price / m.purchase_quantity;
    return sum + costPerUnit * m.stock;
  }, 0);
});

// Modal state
const showProductModal = ref(false);
const productToEdit = ref<any>(null);
const showMaterialModal = ref(false);
const materialToEdit = ref<any>(null);

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

function openProductModal(product: any) {
  productToEdit.value = product;
  showProductModal.value = true;
}

function openMaterialModal(material: any) {
  materialToEdit.value = material;
  showMaterialModal.value = true;
}

function onModalSaved() {
  emit("refresh");
}
</script>

<template>
  <div class="space-y-8 animate-fade-in-up">
    <!-- Welcome Section -->
    <div
      class="bg-white/90 backdrop-blur-md rounded-[2rem] border border-[#4A5D23]/10 shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6"
    >
      <div>
        <h2 class="text-3xl font-playfair font-black text-[#2A321B] mb-2">
          ¡Hola,
          {{ authStore.profile?.full_name?.split(" ")[0] || "Administrador" }}!
        </h2>
        <p class="text-[#4A5D23]/80 font-medium">
          Aquí tienes un resumen del estado actual de tu pastelería.
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p
            class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest"
          >
            Valor del Almacén
          </p>
          <p class="text-2xl font-black text-[#2A321B]">
            S/ {{ totalInventoryValue.toFixed(2) }}
          </p>
        </div>
        <div
          class="w-12 h-12 rounded-full bg-[#F4F1E1] border border-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23]"
        >
          <Icon name="lucide:wallet" class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        class="bg-white p-6 rounded-2xl border border-[#4A5D23]/10 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center border border-[#4A5D23]/20"
        >
          <Icon name="lucide:cake-slice" class="w-6 h-6" />
        </div>
        <div>
          <p
            class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest"
          >
            Productos en Catálogo
          </p>
          <p class="text-2xl font-black text-[#2A321B]">{{ totalProducts }}</p>
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-2xl border border-[#4A5D23]/10 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center border border-[#4A5D23]/20"
        >
          <Icon name="lucide:scale" class="w-6 h-6" />
        </div>
        <div>
          <p
            class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest"
          >
            Insumos Registrados
          </p>
          <p class="text-2xl font-black text-[#2A321B]">{{ totalMaterials }}</p>
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-2xl border border-[#4A5D23]/10 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200"
        >
          <Icon name="lucide:alert-circle" class="w-6 h-6" />
        </div>
        <div>
          <p
            class="text-[10px] font-bold text-amber-700 uppercase tracking-widest"
          >
            Bajo Stock (Vitrina)
          </p>
          <p class="text-2xl font-black text-[#2A321B]">
            {{ lowStockProducts.length }}
          </p>
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-2xl border border-[#4A5D23]/10 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center border border-red-200"
        >
          <Icon name="lucide:triangle-alert" class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[10px] font-bold text-red-700 uppercase tracking-widest">
            Bajo Stock (Almacén)
          </p>
          <p class="text-2xl font-black text-[#2A321B]">
            {{ lowStockMaterials.length }}
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Lists / Tables -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Low Stock Products -->
      <div
        class="bg-white p-6 rounded-[2rem] border border-[#4A5D23]/10 shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-playfair font-black text-[#2A321B]">
            Productos con Stock Crítico
          </h3>
          <span
            class="text-xs font-bold bg-[#F4F1E1] text-[#4A5D23] px-2.5 py-1 rounded-full"
          >
            {{ lowStockProducts.length }} alerta(s)
          </span>
        </div>

        <div
          v-if="lowStockProducts.length === 0"
          class="py-8 text-center text-sm font-medium text-[#4A5D23]/60"
        >
          <Icon
            name="lucide:check-circle-2"
            class="w-8 h-8 mx-auto mb-2 text-[#4A5D23]"
          />
          El inventario de vitrina está en niveles saludables.
        </div>

        <div v-else class="divide-y divide-[#4A5D23]/5">
          <div
            v-for="p in lowStockProducts"
            :key="p.id"
            class="py-3 flex items-center justify-between"
          >
            <div>
              <p class="font-bold text-sm text-[#2A321B]">{{ p.name }}</p>
              <p class="text-xs text-[#4A5D23]">S/ {{ p.price.toFixed(2) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'text-xs font-bold px-2.5 py-1 rounded-full',
                  p.stock === 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800',
                ]"
              >
                {{ p.stock === 0 ? "Agotado" : `${p.stock} unid.` }}
              </span>
              <button
                @click="openProductModal(p)"
                class="text-xs font-bold text-[#4A5D23] hover:underline"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Low Stock Materials -->
      <div
        class="bg-white p-6 rounded-[2rem] border border-[#4A5D23]/10 shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-playfair font-black text-[#2A321B]">
            Insumos con Stock Crítico
          </h3>
          <span
            class="text-xs font-bold bg-[#F4F1E1] text-[#4A5D23] px-2.5 py-1 rounded-full"
          >
            {{ lowStockMaterials.length }} alerta(s)
          </span>
        </div>

        <div
          v-if="lowStockMaterials.length === 0"
          class="py-8 text-center text-sm font-medium text-[#4A5D23]/60"
        >
          <Icon
            name="lucide:check-circle-2"
            class="w-8 h-8 mx-auto mb-2 text-[#4A5D23]"
          />
          El almacén tiene suficiente stock de todos los insumos.
        </div>

        <div v-else class="divide-y divide-[#4A5D23]/5">
          <div
            v-for="m in lowStockMaterials"
            :key="m.id"
            class="py-3 flex items-center justify-between"
          >
            <div>
              <p class="font-bold text-sm text-[#2A321B]">{{ m.name }}</p>
              <p class="text-xs text-[#4A5D23]">
                S/ {{ (m.cost_per_unit || 0).toFixed(4) }} por {{ m.unit }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'text-xs font-bold px-2.5 py-1 rounded-full',
                  m.stock === 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800',
                ]"
              >
                {{ m.stock }} {{ m.unit }}
              </span>
              <button
                @click="openMaterialModal(m)"
                class="text-xs font-bold text-[#4A5D23] hover:underline"
              >
                Reabastecer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AdminProductModal
      :show="showProductModal"
      :productToEdit="productToEdit"
      @close="showProductModal = false"
      @saved="onModalSaved"
    />

    <AdminMaterialModal
      :show="showMaterialModal"
      :materialToEdit="materialToEdit"
      @close="showMaterialModal = false"
      @saved="onModalSaved"
    />
  </div>
</template>
