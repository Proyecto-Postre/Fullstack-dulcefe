<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import type { ProductRow } from "~/types/catalog";
import type { RawMaterialRow } from "~/types/inventory";
import ProductModal from "./ProductModal.vue";
import MaterialModal from "./MaterialModal.vue";

const authStore = useAuthStore();

const props = defineProps<{
  catalog: { success: boolean; data: ProductRow[] } | null | undefined;
  materials: { success: boolean; data: RawMaterialRow[] } | null | undefined;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

// Computed properties for dashboard metrics
const totalProducts = computed<number>(() => props.catalog?.data?.length || 0);
const totalMaterials = computed<number>(() => props.materials?.data?.length || 0);

const lowStockProducts = computed<ProductRow[]>(() => {
  if (!props.catalog?.data) return [];
  return props.catalog.data.filter((p: ProductRow) => Number(p.stock) <= 5);
});

const lowStockMaterials = computed<RawMaterialRow[]>(() => {
  if (!props.materials?.data) return [];
  return props.materials.data.filter((m: RawMaterialRow) => {
    const stock = Number(m.stock || 0);
    if (m.unit === "g" || m.unit === "ml") return stock <= 500;
    return stock <= 5;
  });
});

const totalInventoryValue = computed<number>(() => {
  if (!props.materials?.data) return 0;
  return props.materials.data.reduce((sum: number, m: RawMaterialRow) => {
    const price = Number(m.purchase_price || 0);
    const qty = Number(m.purchase_quantity || 1);
    const costPerUnit = qty > 0 ? price / qty : 0;
    const stock = Number(m.stock || 0);
    return sum + costPerUnit * stock;
  }, 0);
});

// Modal state
const showProductModal = ref(false);
const productToEdit = ref<ProductRow | null>(null);
const showMaterialModal = ref(false);
const materialToEdit = ref<RawMaterialRow | null>(null);

function openProductModal(product: ProductRow): void {
  productToEdit.value = product;
  showProductModal.value = true;
}

function openMaterialModal(material: RawMaterialRow): void {
  materialToEdit.value = material;
  showMaterialModal.value = true;
}

function onModalSaved(): void {
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
        class="bg-white rounded-[2rem] p-6 border border-[#4A5D23]/10 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-2xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center font-bold"
        >
          <Icon name="lucide:cake-slice" class="w-6 h-6" />
        </div>
        <div>
          <p
            class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest"
          >
            Productos Vitrina
          </p>
          <p class="text-2xl font-black text-[#2A321B]">{{ totalProducts }}</p>
        </div>
      </div>

      <div
        class="bg-white rounded-[2rem] p-6 border border-[#4A5D23]/10 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-2xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center font-bold"
        >
          <Icon name="lucide:scale" class="w-6 h-6" />
        </div>
        <div>
          <p
            class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest"
          >
            Insumos Almacén
          </p>
          <p class="text-2xl font-black text-[#2A321B]">
            {{ totalMaterials }}
          </p>
        </div>
      </div>

      <div
        class="bg-white rounded-[2rem] p-6 border border-[#4A5D23]/10 shadow-sm flex items-center gap-4"
      >
        <div
          :class="[
            'w-12 h-12 rounded-2xl flex items-center justify-center font-bold',
            lowStockProducts.length > 0
              ? 'bg-amber-100 text-amber-700'
              : 'bg-[#F4F1E1] text-[#4A5D23]',
          ]"
        >
          <Icon name="lucide:alert-triangle" class="w-6 h-6" />
        </div>
        <div>
          <p
            class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest"
          >
            Prod. Stock Bajo
          </p>
          <p class="text-2xl font-black text-[#2A321B]">
            {{ lowStockProducts.length }}
          </p>
        </div>
      </div>

      <div
        class="bg-white rounded-[2rem] p-6 border border-[#4A5D23]/10 shadow-sm flex items-center gap-4"
      >
        <div
          :class="[
            'w-12 h-12 rounded-2xl flex items-center justify-center font-bold',
            lowStockMaterials.length > 0
              ? 'bg-red-100 text-red-700'
              : 'bg-[#F4F1E1] text-[#4A5D23]',
          ]"
        >
          <Icon name="lucide:package-x" class="w-6 h-6" />
        </div>
        <div>
          <p
            class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest"
          >
            Insumos Críticos
          </p>
          <p class="text-2xl font-black text-[#2A321B]">
            {{ lowStockMaterials.length }}
          </p>
        </div>
      </div>
    </div>

    <!-- Alert Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Low Stock Products List -->
      <div
        class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-sm p-6 flex flex-col"
      >
        <h3
          class="font-playfair font-bold text-lg text-[#2A321B] mb-4 flex items-center gap-2"
        >
          <Icon name="lucide:cake" class="w-5 h-5 text-[#4A5D23]" />
          Productos por Agotarse (≤ 5 und)
        </h3>

        <div
          v-if="lowStockProducts.length === 0"
          class="flex-1 flex flex-col items-center justify-center py-8 text-center"
        >
          <Icon
            name="lucide:check-circle"
            class="w-12 h-12 text-[#4A5D23]/30 mb-2"
          />
          <p class="text-sm font-medium text-[#4A5D23]/60">
            ¡Excelente! Tu vitrina está bien abastecida.
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="p in lowStockProducts"
            :key="p.id"
            class="flex items-center justify-between p-3 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10"
          >
            <div class="flex items-center gap-3">
              <img
                :src="p.image_url || '/placeholder-cake.png'"
                class="w-10 h-10 rounded-lg object-cover bg-white"
              />
              <div>
                <h4 class="font-bold text-sm text-[#2A321B]">{{ p.name }}</h4>
                <p class="text-xs text-[#4A5D23]/70 font-medium">
                  S/ {{ Number(p.price).toFixed(2) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-2.5 py-1 rounded-full text-xs font-bold',
                  p.stock === 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800',
                ]"
              >
                {{ p.stock === 0 ? "Agotado" : `${p.stock} disponibles` }}
              </span>
              <button
                @click="openProductModal(p)"
                type="button"
                class="text-xs font-bold text-[#4A5D23] hover:underline cursor-pointer"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Materials List -->
      <div
        class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-sm p-6 flex flex-col"
      >
        <h3
          class="font-playfair font-bold text-lg text-[#2A321B] mb-4 flex items-center gap-2"
        >
          <Icon name="lucide:scale" class="w-5 h-5 text-[#4A5D23]" />
          Insumos con Stock Bajo
        </h3>

        <div
          v-if="lowStockMaterials.length === 0"
          class="flex-1 flex flex-col items-center justify-center py-8 text-center"
        >
          <Icon
            name="lucide:check-circle"
            class="w-12 h-12 text-[#4A5D23]/30 mb-2"
          />
          <p class="text-sm font-medium text-[#4A5D23]/60">
            Todos los insumos del almacén tienen stock suficiente.
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="m in lowStockMaterials"
            :key="m.id"
            class="flex items-center justify-between p-3 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10"
          >
            <div>
              <h4 class="font-bold text-sm text-[#2A321B]">{{ m.name }}</h4>
              <p class="text-[10px] font-bold uppercase tracking-wider text-[#4A5D23]/70">
                Costo Base: S/ {{ Number(m.purchase_price).toFixed(2) }} x {{ m.purchase_quantity }} {{ m.unit }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-2.5 py-1 rounded-full text-xs font-bold',
                  m.stock === 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800',
                ]"
              >
                {{ m.stock }} {{ m.unit }}
              </span>
              <button
                @click="openMaterialModal(m)"
                type="button"
                class="text-xs font-bold text-[#4A5D23] hover:underline cursor-pointer"
              >
                Reabastecer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ProductModal
      :show="showProductModal"
      :productToEdit="productToEdit"
      @close="showProductModal = false"
      @saved="onModalSaved"
    />

    <MaterialModal
      :show="showMaterialModal"
      :materialToEdit="materialToEdit"
      @close="showMaterialModal = false"
      @saved="onModalSaved"
    />
  </div>
</template>
