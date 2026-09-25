<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import type { ProductRow } from "~/types/catalog";
import type { RawMaterialRow } from "~/types/inventory";
import ProductModal from "./ProductModal.vue";
import MaterialModal from "./MaterialModal.vue";
import { getMaterialIcon } from "~/composables/admin/useAdminMaterials";

export interface AtRiskProductItem {
  product_id: number;
  product_name: string;
  price: number;
  image_url: string | null;
  critical_materials: Array<{
    material_name: string;
    unit: string;
    required: number;
    available: number;
  }>;
}

const authStore = useAuthStore();

const props = defineProps<{
  catalog: { success: boolean; data: ProductRow[] } | null | undefined;
  materials: { success: boolean; data: RawMaterialRow[] } | null | undefined;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "view-recipe", product: ProductRow): void;
}>();

// Consulta reactiva a productos en riesgo de producción
const { data: atRiskData, refresh: refreshAtRisk, pending: pendingAtRisk } = await useFetch<{
  success: boolean;
  data: AtRiskProductItem[];
}>('/api/admin/dashboard/at-risk-products', {
  default: () => ({ success: true, data: [] })
});

const atRiskProducts = computed<AtRiskProductItem[]>(() => {
  return atRiskData.value?.data || [];
});

const currentDateFormatted = computed<string>(() => {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
});

// Computed properties for dashboard metrics
const totalProducts = computed<number>(() => props.catalog?.data?.length || 0);
const totalMaterials = computed<number>(() => props.materials?.data?.length || 0);

// Helper para compatibilidad de stock tradicional
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

// Paginación adaptativa según la altura de la pantalla (Viewport Height)
const itemsPerPage = ref<number>(5);

function updateItemsPerPage(): void {
  if (typeof window === "undefined") return;
  if (window.innerWidth < 1024) {
    itemsPerPage.value = 5;
    return;
  }
  const availableHeight = window.innerHeight - 420;
  const rowHeight = 54;
  const calculated = Math.floor(availableHeight / rowHeight) - 1;
  itemsPerPage.value = Math.max(5, Math.min(calculated, 10));
}

// Paginación de Productos en Riesgo
const currentAtRiskPage = ref<number>(1);
const totalAtRiskPages = computed<number>(() => {
  if (!atRiskProducts.value.length) return 1;
  return Math.ceil(atRiskProducts.value.length / itemsPerPage.value);
});
const paginatedAtRiskProducts = computed<AtRiskProductItem[]>(() => {
  const start = (currentAtRiskPage.value - 1) * itemsPerPage.value;
  return atRiskProducts.value.slice(start, start + itemsPerPage.value);
});

function nextAtRiskPage(): void {
  if (currentAtRiskPage.value < totalAtRiskPages.value) {
    currentAtRiskPage.value++;
  }
}

function prevAtRiskPage(): void {
  if (currentAtRiskPage.value > 1) {
    currentAtRiskPage.value--;
  }
}

watch(
  () => atRiskProducts.value.length,
  () => {
    if (currentAtRiskPage.value > totalAtRiskPages.value) {
      currentAtRiskPage.value = Math.max(1, totalAtRiskPages.value);
    }
  }
);

// Paginación de Insumos con Stock Bajo
const currentMaterialsPage = ref<number>(1);
const totalMaterialsPages = computed<number>(() => {
  if (!lowStockMaterials.value.length) return 1;
  return Math.ceil(lowStockMaterials.value.length / itemsPerPage.value);
});
const paginatedLowStockMaterials = computed<RawMaterialRow[]>(() => {
  const start = (currentMaterialsPage.value - 1) * itemsPerPage.value;
  return lowStockMaterials.value.slice(start, start + itemsPerPage.value);
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

watch(itemsPerPage, () => {
  if (currentAtRiskPage.value > totalAtRiskPages.value) {
    currentAtRiskPage.value = Math.max(1, totalAtRiskPages.value);
  }
  if (currentMaterialsPage.value > totalMaterialsPages.value) {
    currentMaterialsPage.value = Math.max(1, totalMaterialsPages.value);
  }
});

// Modal state
const showProductModal = ref(false);
const productToEdit = ref<ProductRow | null>(null);
const showMaterialModal = ref(false);
const materialToEdit = ref<RawMaterialRow | null>(null);

function openProductModalFromRisk(riskItem: AtRiskProductItem): void {
  const matched = props.catalog?.data?.find((p) => p.id === riskItem.product_id);
  if (matched) {
    productToEdit.value = matched;
    showProductModal.value = true;
  }
}

function openMaterialModal(material: RawMaterialRow): void {
  materialToEdit.value = material;
  showMaterialModal.value = true;
}

function onModalSaved(): void {
  emit("refresh");
  refreshAtRisk();
}

// Control de Carrusel de Métricas en Mobile (< sm)
const activeMetricIndex = ref<number>(0);
const metricsCarouselRef = ref<HTMLElement | null>(null);
const isCarouselPaused = ref<boolean>(false);
let carouselInterval: ReturnType<typeof setInterval> | null = null;

function isElementInViewport(el: HTMLElement): boolean {
  if (typeof window === "undefined") return false;
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom > 0 && rect.top < windowHeight;
}

function scrollToMetric(index: number): void {
  activeMetricIndex.value = index;
  if (metricsCarouselRef.value) {
    const container = metricsCarouselRef.value;
    const cards = container.children;
    if (cards && cards[index]) {
      const firstCard = cards[0] as HTMLElement;
      const targetCard = cards[index] as HTMLElement;
      const baseOffset = firstCard ? firstCard.offsetLeft : 0;
      const targetLeft = targetCard.offsetLeft - baseOffset;
      container.scrollTo({
        left: targetLeft,
        behavior: "smooth",
      });
    }
  }
}

function onCarouselScroll(): void {
  if (!metricsCarouselRef.value) return;
  const container = metricsCarouselRef.value;
  const scrollLeft = container.scrollLeft;
  const cards = container.children;
  if (!cards || cards.length === 0) return;

  const firstCard = cards[0] as HTMLElement;
  const baseOffset = firstCard ? firstCard.offsetLeft : 0;

  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < Math.min(cards.length, 4); i++) {
    const card = cards[i] as HTMLElement;
    const cardRelativeLeft = card.offsetLeft - baseOffset;
    const diff = Math.abs(cardRelativeLeft - scrollLeft);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }
  if (closestIndex !== activeMetricIndex.value) {
    activeMetricIndex.value = closestIndex;
  }
}

function pauseCarousel(): void {
  isCarouselPaused.value = true;
}

function resumeCarousel(): void {
  isCarouselPaused.value = false;
}

function startCarousel(): void {
  stopCarousel();
  carouselInterval = setInterval(() => {
    if (!isCarouselPaused.value && metricsCarouselRef.value) {
      if (isElementInViewport(metricsCarouselRef.value)) {
        const nextIndex = (activeMetricIndex.value + 1) % 4;
        scrollToMetric(nextIndex);
      }
    }
  }, 4000);
}

function stopCarousel(): void {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
}

// Control de Pestañas de Alertas en Mobile (< lg)
const activeAlertTab = ref<"products" | "materials">("products");

onMounted(() => {
  updateItemsPerPage();
  window.addEventListener("resize", updateItemsPerPage);
  startCarousel();
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateItemsPerPage);
  }
  stopCarousel();
});
</script>

<template>
  <div class="space-y-3 sm:space-y-3.5 animate-fade-in-up">
    <!-- Welcome Section -->
    <div
      class="bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 shadow-soft-sm p-3.5 sm:p-4 lg:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5"
    >
      <div>
        <h2 class="text-xl sm:text-2xl font-playfair font-bold text-[#2A321B]">
          ¡Hola, {{ authStore.profile?.full_name?.split(" ")[0] || "Administrador" }}!
        </h2>
        <p class="text-xs sm:text-sm text-[#4A5D23]/70 font-medium mt-0.5">
          {{ currentDateFormatted }} • Estado operativo, abastecimiento y alertas preventivas.
        </p>
      </div>

      <!-- Widget Valor del Almacén -->
      <div class="bg-[#F4F1E1]/60 border border-[#4A5D23]/10 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-3 shrink-0">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-soft-sm shrink-0">
          <Icon name="lucide:wallet" class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <p class="text-[9px] sm:text-[10px] font-bold text-[#4A5D23]/70 uppercase tracking-wider">
            Valor del Almacén
          </p>
          <p class="text-lg sm:text-xl font-bold text-[#2A321B] font-inter leading-tight">
            S/ {{ totalInventoryValue.toFixed(2) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Carrusel / Grid de Métricas Principales (KPIs) -->
    <div>
      <div
        ref="metricsCarouselRef"
        @scroll.passive="onCarouselScroll"
        @touchstart.passive="pauseCarousel"
        @touchend.passive="resumeCarousel"
        class="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none hide-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0 py-0.5"
      >
        <!-- KPI 1: Total Productos -->
        <div
          class="snap-start shrink-0 w-full sm:w-auto sm:shrink sm:grow min-w-[200px] bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm flex items-center gap-3.5 transition-all hover:border-[#4A5D23]/25"
        >
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center shrink-0 shadow-soft-sm">
            <Icon name="lucide:cake" class="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </div>
          <div>
            <p class="text-[10px] sm:text-xs font-bold text-[#4A5D23]/70 uppercase tracking-wider">
              Productos en Vitrina
            </p>
            <p class="text-lg sm:text-xl font-bold text-[#2A321B] font-inter leading-tight mt-0.5">
              {{ totalProducts }}
            </p>
          </div>
        </div>

        <!-- KPI 2: Productos en Riesgo por Falta de Insumos (PREVENTIVO) -->
        <div
          class="snap-start shrink-0 w-full sm:w-auto sm:shrink sm:grow min-w-[200px] bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm flex items-center gap-3.5 transition-all hover:border-[#4A5D23]/25"
        >
          <div
            :class="[
              'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-soft-sm',
              atRiskProducts.length > 0
                ? 'bg-red-500/10 text-red-700'
                : 'bg-lime-500/10 text-lime-700',
            ]"
          >
            <Icon :name="atRiskProducts.length > 0 ? 'lucide:alert-circle' : 'lucide:shield-check'" class="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </div>
          <div>
            <p class="text-[10px] sm:text-xs font-bold text-[#4A5D23]/70 uppercase tracking-wider">
              Productos en Riesgo
            </p>
            <p
              :class="[
                'text-lg sm:text-xl font-black font-inter leading-tight mt-0.5',
                atRiskProducts.length > 0 ? 'text-red-700' : 'text-lime-700',
              ]"
            >
              {{ atRiskProducts.length }}
            </p>
          </div>
        </div>

        <!-- KPI 3: Total Insumos en Almacén -->
        <div
          class="snap-start shrink-0 w-full sm:w-auto sm:shrink sm:grow min-w-[200px] bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm flex items-center gap-3.5 transition-all hover:border-[#4A5D23]/25"
        >
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center shrink-0 shadow-soft-sm">
            <Icon name="lucide:boxes" class="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </div>
          <div>
            <p class="text-[10px] sm:text-xs font-bold text-[#4A5D23]/70 uppercase tracking-wider">
              Insumos Registrados
            </p>
            <p class="text-lg sm:text-xl font-bold text-[#2A321B] font-inter leading-tight mt-0.5">
              {{ totalMaterials }}
            </p>
          </div>
        </div>

        <!-- KPI 4: Insumos con Stock Bajo -->
        <div
          class="snap-start shrink-0 w-full sm:w-auto sm:shrink sm:grow min-w-[200px] bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm flex items-center gap-3.5 transition-all hover:border-[#4A5D23]/25"
        >
          <div
            :class="[
              'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-soft-sm',
              lowStockMaterials.length > 0
                ? 'bg-red-500/10 text-red-700'
                : 'bg-[#F4F1E1] text-[#4A5D23]',
            ]"
          >
            <Icon name="lucide:scale" class="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </div>
          <div>
            <p class="text-[10px] sm:text-xs font-bold text-[#4A5D23]/70 uppercase tracking-wider">
              Insumos Stock Bajo
            </p>
            <p
              :class="[
                'text-lg sm:text-xl font-bold font-inter leading-tight mt-0.5',
                lowStockMaterials.length > 0 ? 'text-red-700' : 'text-[#2A321B]',
              ]"
            >
              {{ lowStockMaterials.length }}
            </p>
          </div>
        </div>
      </div>

      <!-- Indicadores de Dots (Solo Mobile < sm) -->
      <div class="flex sm:hidden items-center justify-center gap-1.5 mt-2.5">
        <button
          v-for="i in 4"
          :key="i"
          type="button"
          @click="scrollToMetric(i - 1)"
          :class="[
            'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
            activeMetricIndex === i - 1
              ? 'w-5 bg-brand-primary'
              : 'w-1.5 bg-brand-primary/25 hover:bg-brand-primary/40',
          ]"
          :aria-label="`Ir a métrica ${i}`"
        />
      </div>
    </div>

    <!-- Segmented Control / Switch de Alertas (Solo Mobile < lg) -->
    <div class="lg:hidden">
      <div class="bg-[#F4F1E1] p-1 rounded-2xl flex border border-[#4A5D23]/15 shadow-2xs">
        <button
          @click="activeAlertTab = 'products'"
          type="button"
          :class="[
            'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer',
            activeAlertTab === 'products'
              ? 'bg-white text-brand-secondary shadow-soft-sm'
              : 'text-[#4A5D23]/70 hover:text-brand-secondary',
          ]"
        >
          <Icon name="lucide:alert-circle" class="w-4 h-4 text-red-600" />
          <span>En Riesgo</span>
          <span
            v-if="atRiskProducts.length"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-200"
          >
            {{ atRiskProducts.length }}
          </span>
        </button>

        <button
          @click="activeAlertTab = 'materials'"
          type="button"
          :class="[
            'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer',
            activeAlertTab === 'materials'
              ? 'bg-white text-brand-secondary shadow-soft-sm'
              : 'text-[#4A5D23]/70 hover:text-brand-secondary',
          ]"
        >
          <Icon name="lucide:scale" class="w-4 h-4 text-[#4A5D23]" />
          <span>Insumos bajos</span>
          <span
            v-if="lowStockMaterials.length"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
          >
            {{ lowStockMaterials.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Secciones Operativas de Alerta -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
      <!-- Columna 1: Productos en Riesgo por Falta de Insumos -->
      <div
        :class="[
          'bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 shadow-soft-sm p-3.5 sm:p-4 lg:p-4.5 flex-col justify-between',
          activeAlertTab === 'products' ? 'flex' : 'hidden lg:flex',
        ]"
      >
        <div>
          <div class="flex items-center justify-between mb-2.5 sm:mb-3">
            <h3 class="font-playfair font-bold text-sm sm:text-base text-[#2A321B] flex items-center gap-2">
              <Icon name="lucide:alert-circle" class="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <span>Productos en Riesgo de Producción</span>
            </h3>
            <span
              v-if="atRiskProducts.length"
              class="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-50 text-red-800 border border-red-200 shrink-0"
            >
              {{ atRiskProducts.length }} {{ atRiskProducts.length === 1 ? 'en riesgo' : 'en riesgo' }}
            </span>
          </div>

          <div
            v-if="atRiskProducts.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <Icon
              name="lucide:shield-check"
              class="w-10 h-10 text-lime-600/60 mb-1.5"
            />
            <h4 class="text-xs sm:text-sm font-bold text-brand-secondary">
              ¡Taller 100% abastecido!
            </h4>
            <p class="text-[11px] sm:text-xs font-medium text-[#4A5D23]/70 max-w-sm mt-0.5">
              Todos los postres cuentan con materias primas y empaques suficientes para producirse hoy.
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="p in paginatedAtRiskProducts"
              :key="p.product_id"
              class="p-2.5 sm:p-3 rounded-xl bg-red-50/40 border border-red-200/60 hover:bg-red-50/70 transition-colors flex flex-col gap-2"
            >
              <div class="flex items-center justify-between gap-2.5">
                <div class="flex items-center gap-2.5 min-w-0">
                  <img
                    :src="p.image_url || '/placeholder-cake.png'"
                    :alt="p.product_name"
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-white border border-[#4A5D23]/10 shrink-0"
                  />
                  <div class="min-w-0">
                    <h4 class="font-bold text-xs sm:text-sm text-[#2A321B] truncate">{{ p.product_name }}</h4>
                    <p class="text-[11px] text-[#4A5D23]/70 font-medium">
                      Precio: S/ {{ Number(p.price).toFixed(2) }}
                    </p>
                  </div>
                </div>
                <button
                  @click="openProductModalFromRisk(p)"
                  type="button"
                  class="px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold text-brand-primary bg-white hover:bg-brand-primary hover:text-white border border-brand-primary/20 shadow-2xs hover:shadow-soft-sm transition-all cursor-pointer shrink-0"
                >
                  Revisar
                </button>
              </div>

              <!-- Desglose de Insumos Críticos Faltantes -->
              <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-red-100">
                <span
                  v-for="(crit, idx) in p.critical_materials"
                  :key="idx"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-red-800 border border-red-200 shadow-2xs"
                >
                  <Icon name="lucide:alert-triangle" class="w-3 h-3 text-red-600 shrink-0" />
                  <span>Falta: <strong>{{ crit.material_name }}</strong> (quedan {{ crit.available }} {{ crit.unit }}, requiere {{ crit.required }})</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación de Productos en Riesgo -->
        <div
          v-if="totalAtRiskPages > 1"
          class="mt-2.5 pt-2.5 border-t border-[#4A5D23]/10 flex items-center justify-between"
        >
          <span class="text-[11px] sm:text-xs text-[#4A5D23]/70 font-medium">
            Página {{ currentAtRiskPage }} de {{ totalAtRiskPages }}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevAtRiskPage"
              :disabled="currentAtRiskPage <= 1"
              type="button"
              class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#4A5D23]/20 bg-white text-[11px] sm:text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              @click="nextAtRiskPage"
              :disabled="currentAtRiskPage >= totalAtRiskPages"
              type="button"
              class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#4A5D23]/20 bg-white text-[11px] sm:text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>Siguiente</span>
              <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Columna 2: Insumos con Stock Bajo en Almacén -->
      <div
        :class="[
          'bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 shadow-soft-sm p-3.5 sm:p-4 lg:p-4.5 flex-col justify-between',
          activeAlertTab === 'materials' ? 'flex' : 'hidden lg:flex',
        ]"
      >
        <div>
          <div class="flex items-center justify-between mb-2.5 sm:mb-3">
            <h3 class="font-playfair font-bold text-sm sm:text-base text-[#2A321B] flex items-center gap-2">
              <Icon name="lucide:scale" class="w-4 h-4 sm:w-5 sm:h-5 text-[#4A5D23]" />
              <span>Insumos con stock bajo</span>
            </h3>
            <span
              v-if="lowStockMaterials.length"
              class="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0"
            >
              {{ lowStockMaterials.length }} {{ lowStockMaterials.length === 1 ? 'insumo' : 'insumos' }}
            </span>
          </div>

          <div
            v-if="lowStockMaterials.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <Icon
              name="lucide:check-circle"
              class="w-10 h-10 text-[#4A5D23]/30 mb-1.5"
            />
            <p class="text-xs sm:text-sm font-medium text-[#4A5D23]/60">
              ¡Excelente! Tus insumos están en niveles óptimos.
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="m in paginatedLowStockMaterials"
              :key="m.id"
              class="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10 hover:bg-[#F4F1E1]/70 transition-colors"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F4F1E1] border border-[#4A5D23]/10 flex items-center justify-center text-[#4A5D23] shrink-0">
                  <Icon :name="getMaterialIcon(m.name)" class="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-xs sm:text-sm text-[#2A321B] truncate">{{ m.name }}</h4>
                  <p class="text-[11px] text-[#4A5D23]/70 font-medium">
                    Stock: {{ Number(m.stock || 0) }} {{ m.unit }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Crítico
                </span>
                <button
                  @click="openMaterialModal(m)"
                  type="button"
                  class="px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold text-brand-primary bg-white hover:bg-brand-primary hover:text-white border border-brand-primary/20 shadow-2xs hover:shadow-soft-sm transition-all cursor-pointer"
                  aria-label="Editar insumo"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación de Insumos -->
        <div
          v-if="totalMaterialsPages > 1"
          class="mt-2.5 pt-2.5 border-t border-[#4A5D23]/10 flex items-center justify-between"
        >
          <span class="text-[11px] sm:text-xs text-[#4A5D23]/70 font-medium">
            Página {{ currentMaterialsPage }} de {{ totalMaterialsPages }}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevMaterialsPage"
              :disabled="currentMaterialsPage <= 1"
              type="button"
              class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#4A5D23]/20 bg-white text-[11px] sm:text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              @click="nextMaterialsPage"
              :disabled="currentMaterialsPage >= totalMaterialsPages"
              type="button"
              class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#4A5D23]/20 bg-white text-[11px] sm:text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>Siguiente</span>
              <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales de Producto e Insumo -->
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
