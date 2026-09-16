<script setup lang="ts">
import { ref, computed, watch } from "vue";
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

// Paginación para Alertas de Stock (5 elementos por página)
const ITEMS_PER_PAGE = 5;

// Paginación de Productos por Agotarse
const currentProductsPage = ref<number>(1);
const totalProductsPages = computed<number>(() => {
  if (!lowStockProducts.value.length) return 1;
  return Math.ceil(lowStockProducts.value.length / ITEMS_PER_PAGE);
});
const paginatedLowStockProducts = computed<ProductRow[]>(() => {
  const start = (currentProductsPage.value - 1) * ITEMS_PER_PAGE;
  return lowStockProducts.value.slice(start, start + ITEMS_PER_PAGE);
});

function nextProductsPage(): void {
  if (currentProductsPage.value < totalProductsPages.value) {
    currentProductsPage.value++;
  }
}

function prevProductsPage(): void {
  if (currentProductsPage.value > 1) {
    currentProductsPage.value--;
  }
}

watch(
  () => lowStockProducts.value.length,
  () => {
    if (currentProductsPage.value > totalProductsPages.value) {
      currentProductsPage.value = Math.max(1, totalProductsPages.value);
    }
  }
);

// Paginación de Insumos con Stock Bajo
const currentMaterialsPage = ref<number>(1);
const totalMaterialsPages = computed<number>(() => {
  if (!lowStockMaterials.value.length) return 1;
  return Math.ceil(lowStockMaterials.value.length / ITEMS_PER_PAGE);
});
const paginatedLowStockMaterials = computed<RawMaterialRow[]>(() => {
  const start = (currentMaterialsPage.value - 1) * ITEMS_PER_PAGE;
  return lowStockMaterials.value.slice(start, start + ITEMS_PER_PAGE);
});

function nextMaterialsPage(): void {
  if (currentMaterialsPage.value < totalMaterialsPages.value) {
    currentMaterialsPage.value++;
  }
}

function prevMaterialsPage(): void {
  if (currentMaterialsPage.value > 1) {
    currentMaterialsPage.value--;
  }
}

watch(
  () => lowStockMaterials.value.length,
  () => {
    if (currentMaterialsPage.value > totalMaterialsPages.value) {
      currentMaterialsPage.value = Math.max(1, totalMaterialsPages.value);
    }
  }
);

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
        class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-sm p-6 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3
              class="font-playfair font-bold text-lg text-[#2A321B] flex items-center gap-2"
            >
              <Icon name="lucide:cake" class="w-5 h-5 text-[#4A5D23]" />
              <span>Productos por Agotarse (≤ 5 und)</span>
            </h3>
            <span
              v-if="lowStockProducts.length"
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20 shrink-0"
            >
              {{ lowStockProducts.length }} {{ lowStockProducts.length === 1 ? 'producto' : 'productos' }}
            </span>
          </div>

          <div
            v-if="lowStockProducts.length === 0"
            class="flex flex-col items-center justify-center py-10 text-center"
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
              v-for="p in paginatedLowStockProducts"
              :key="p.id"
              class="flex items-center justify-between p-3 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10 hover:bg-[#F4F1E1]/70 transition-colors"
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

        <!-- Paginación de Productos -->
        <div
          v-if="totalProductsPages > 1"
          class="mt-4 pt-4 border-t border-[#4A5D23]/10 flex items-center justify-between"
        >
          <span class="text-xs text-[#4A5D23]/70 font-medium">
            Página {{ currentProductsPage }} de {{ totalProductsPages }}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevProductsPage"
              :disabled="currentProductsPage <= 1"
              type="button"
              class="px-2.5 py-1 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1]/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              @click="nextProductsPage"
              :disabled="currentProductsPage >= totalProductsPages"
              type="button"
              class="px-2.5 py-1 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1]/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <span>Siguiente</span>
              <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Critical Materials List -->
      <div
        class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-sm p-6 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3
              class="font-playfair font-bold text-lg text-[#2A321B] flex items-center gap-2"
            >
              <Icon name="lucide:scale" class="w-5 h-5 text-[#4A5D23]" />
              <span>Insumos con Stock Bajo</span>
            </h3>
            <span
              v-if="lowStockMaterials.length"
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20 shrink-0"
            >
              {{ lowStockMaterials.length }} {{ lowStockMaterials.length === 1 ? 'insumo' : 'insumos' }}
            </span>
          </div>

          <div
            v-if="lowStockMaterials.length === 0"
            class="flex flex-col items-center justify-center py-10 text-center"
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
              v-for="m in paginatedLowStockMaterials"
              :key="m.id"
              class="flex items-center justify-between p-3 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10 hover:bg-[#F4F1E1]/70 transition-colors"
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

        <!-- Paginación de Insumos -->
        <div
          v-if="totalMaterialsPages > 1"
          class="mt-4 pt-4 border-t border-[#4A5D23]/10 flex items-center justify-between"
        >
          <span class="text-xs text-[#4A5D23]/70 font-medium">
            Página {{ currentMaterialsPage }} de {{ totalMaterialsPages }}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevMaterialsPage"
              :disabled="currentMaterialsPage <= 1"
              type="button"
              class="px-2.5 py-1 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1]/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              @click="nextMaterialsPage"
              :disabled="currentMaterialsPage >= totalMaterialsPages"
              type="button"
              class="px-2.5 py-1 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1]/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <span>Siguiente</span>
              <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
            </button>
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
