<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
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
      // Scroll horizontal exclusivo dentro del contenedor, sin mover el scroll vertical de la ventana
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
      // Solo rotar automáticamente si el carrusel está visible en la pantalla
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
  startCarousel();
});

onUnmounted(() => {
  stopCarousel();
});
</script>

<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in-up">
    <!-- Welcome Section (Cálido, limpio y orgánico) -->
    <div
      class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-soft-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h2 class="text-2xl sm:text-3xl font-playfair font-bold text-[#2A321B]">
          ¡Hola, {{ authStore.profile?.full_name?.split(" ")[0] || "Administrador" }}!
        </h2>
        <p class="text-xs sm:text-sm text-[#4A5D23]/70 font-medium mt-1">
          {{ currentDateFormatted }} • Estado operativo y de abastecimiento.
        </p>
      </div>

      <!-- Widget Valor del Almacén -->
      <div class="bg-[#F4F1E1]/60 border border-[#4A5D23]/10 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-3.5 shrink-0">
        <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-soft-sm shrink-0">
          <Icon name="lucide:wallet" class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[10px] font-bold text-[#4A5D23]/70 uppercase tracking-wider">
            Valor del Almacén
          </p>
          <p class="text-xl sm:text-2xl font-bold text-[#2A321B] font-inter">
            S/ {{ totalInventoryValue.toFixed(2) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Metrics Section: Carrusel Rotativo en Mobile (< sm) / Grid en Desktop (>= sm) -->
    <div>
      <div
        ref="metricsCarouselRef"
        @scroll="onCarouselScroll"
        @touchstart="pauseCarousel"
        @touchend="resumeCarousel"
        @mouseenter="pauseCarousel"
        @mouseleave="resumeCarousel"
        class="relative flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none hide-scrollbar scroll-smooth"
      >
        <!-- 1. Productos Vitrina -->
        <div
          class="w-full shrink-0 snap-center sm:w-auto sm:shrink bg-white rounded-2xl p-3.5 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm hover:shadow-soft-md transition-all flex items-center gap-3.5"
        >
          <div class="w-11 h-11 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center shrink-0">
            <Icon name="lucide:cake-slice" class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#4A5D23]/70 truncate">
              Productos en vitrina
            </p>
            <p class="text-xl sm:text-2xl font-bold text-[#2A321B] font-inter leading-tight">
              {{ totalProducts }}
            </p>
          </div>
        </div>

        <!-- 2. Insumos Almacén -->
        <div
          class="w-full shrink-0 snap-center sm:w-auto sm:shrink bg-white rounded-2xl p-3.5 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm hover:shadow-soft-md transition-all flex items-center gap-3.5"
        >
          <div class="w-11 h-11 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center shrink-0">
            <Icon name="lucide:scale" class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#4A5D23]/70 truncate">
              Insumos registrados
            </p>
            <p class="text-xl sm:text-2xl font-bold text-[#2A321B] font-inter leading-tight">
              {{ totalMaterials }}
            </p>
          </div>
        </div>

        <!-- 3. Prod. Stock Bajo -->
        <div
          class="w-full shrink-0 snap-center sm:w-auto sm:shrink bg-white rounded-2xl p-3.5 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm hover:shadow-soft-md transition-all flex items-center gap-3.5"
        >
          <div
            :class="[
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
              lowStockProducts.length > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-[#F4F1E1] text-[#4A5D23]',
            ]"
          >
            <Icon name="lucide:alert-triangle" class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#4A5D23]/70 truncate">
              Productos por agotarse
            </p>
            <p
              :class="[
                'text-xl sm:text-2xl font-bold font-inter leading-tight',
                lowStockProducts.length > 0 ? 'text-amber-700' : 'text-[#2A321B]',
              ]"
            >
              {{ lowStockProducts.length }}
            </p>
          </div>
        </div>

        <!-- 4. Insumos Críticos -->
        <div
          class="w-full shrink-0 snap-center sm:w-auto sm:shrink bg-white rounded-2xl p-3.5 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm hover:shadow-soft-md transition-all flex items-center gap-3.5"
        >
          <div
            :class="[
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
              lowStockMaterials.length > 0
                ? 'bg-red-50 text-red-600'
                : 'bg-[#F4F1E1] text-[#4A5D23]',
            ]"
          >
            <Icon name="lucide:package-x" class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#4A5D23]/70 truncate">
              Insumos con stock bajo
            </p>
            <p
              :class="[
                'text-xl sm:text-2xl font-bold font-inter leading-tight',
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
          <Icon name="lucide:cake" class="w-4 h-4 text-[#4A5D23]" />
          <span>Por agotarse</span>
          <span
            v-if="lowStockProducts.length"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
          >
            {{ lowStockProducts.length }}
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

    <!-- Alert Sections (Listas Operativas) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
      <!-- Low Stock Products List -->
      <div
        :class="[
          'bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-soft-sm p-5 sm:p-6 flex-col justify-between',
          activeAlertTab === 'products' ? 'flex' : 'hidden lg:flex',
        ]"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-playfair font-bold text-base sm:text-lg text-[#2A321B] flex items-center gap-2">
              <Icon name="lucide:cake" class="w-5 h-5 text-[#4A5D23]" />
              <span>Productos por agotarse</span>
            </h3>
            <span
              v-if="lowStockProducts.length"
              class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0"
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

          <div v-else class="space-y-2.5">
            <div
              v-for="p in paginatedLowStockProducts"
              :key="p.id"
              class="flex items-center justify-between p-3 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10 hover:bg-[#F4F1E1]/70 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <img
                  :src="p.image_url || '/placeholder-cake.png'"
                  :alt="p.name"
                  class="w-10 h-10 rounded-xl object-cover bg-white border border-[#4A5D23]/10 shrink-0"
                />
                <div class="min-w-0">
                  <h4 class="font-bold text-xs sm:text-sm text-[#2A321B] truncate">{{ p.name }}</h4>
                  <p class="text-xs text-[#4A5D23]/70 font-medium">
                    S/ {{ Number(p.price).toFixed(2) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2.5 shrink-0">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-[11px] font-bold border',
                    p.stock === 0
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200',
                  ]"
                >
                  {{ p.stock === 0 ? "Agotado" : p.stock === 1 ? "1 disponible" : `${p.stock} disponibles` }}
                </span>
                <button
                  @click="openProductModal(p)"
                  type="button"
                  class="px-3 py-1 rounded-lg text-xs font-bold text-brand-primary bg-white hover:bg-brand-primary hover:text-white border border-brand-primary/20 shadow-2xs hover:shadow-soft-sm transition-all cursor-pointer"
                  aria-label="Editar producto"
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
          class="mt-4 pt-3.5 border-t border-[#4A5D23]/10 flex items-center justify-between"
        >
          <span class="text-xs text-[#4A5D23]/70 font-medium">
            Página {{ currentProductsPage }} de {{ totalProductsPages }}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevProductsPage"
              :disabled="currentProductsPage <= 1"
              type="button"
              class="px-2.5 py-1 rounded-lg border border-[#4A5D23]/20 bg-white text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
              aria-label="Página anterior de productos"
            >
              <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              @click="nextProductsPage"
              :disabled="currentProductsPage >= totalProductsPages"
              type="button"
              class="px-2.5 py-1 rounded-lg border border-[#4A5D23]/20 bg-white text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
              aria-label="Página siguiente de productos"
            >
              <span>Siguiente</span>
              <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Critical Materials List -->
      <div
        :class="[
          'bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-soft-sm p-5 sm:p-6 flex-col justify-between',
          activeAlertTab === 'materials' ? 'flex' : 'hidden lg:flex',
        ]"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-playfair font-bold text-base sm:text-lg text-[#2A321B] flex items-center gap-2">
              <Icon name="lucide:scale" class="w-5 h-5 text-[#4A5D23]" />
              <span>Insumos con stock bajo</span>
            </h3>
            <span
              v-if="lowStockMaterials.length"
              class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0"
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

          <div v-else class="space-y-2.5">
            <div
              v-for="m in paginatedLowStockMaterials"
              :key="m.id"
              class="flex items-center justify-between p-3 rounded-xl bg-[#F4F1E1]/40 border border-[#4A5D23]/10 hover:bg-[#F4F1E1]/70 transition-colors"
            >
              <div class="min-w-0">
                <h4 class="font-bold text-xs sm:text-sm text-[#2A321B] truncate">{{ m.name }}</h4>
                <p class="text-[10px] font-bold uppercase tracking-wider text-[#4A5D23]/70">
                  Costo Base: S/ {{ Number(m.purchase_price).toFixed(2) }} x {{ m.purchase_quantity }} {{ m.unit }}
                </p>
              </div>
              <div class="flex items-center gap-2.5 shrink-0">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-[11px] font-bold border',
                    m.stock === 0
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200',
                  ]"
                >
                  {{ m.stock }} {{ m.unit }}
                </span>
                <button
                  @click="openMaterialModal(m)"
                  type="button"
                  class="px-3 py-1 rounded-lg text-xs font-bold text-brand-primary bg-white hover:bg-brand-primary hover:text-white border border-brand-primary/20 shadow-2xs hover:shadow-soft-sm transition-all cursor-pointer"
                  aria-label="Reabastecer insumo"
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
          class="mt-4 pt-3.5 border-t border-[#4A5D23]/10 flex items-center justify-between"
        >
          <span class="text-xs text-[#4A5D23]/70 font-medium">
            Página {{ currentMaterialsPage }} de {{ totalMaterialsPages }}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevMaterialsPage"
              :disabled="currentMaterialsPage <= 1"
              type="button"
              class="px-2.5 py-1 rounded-lg border border-[#4A5D23]/20 bg-white text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
              aria-label="Página anterior de insumos"
            >
              <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              @click="nextMaterialsPage"
              :disabled="currentMaterialsPage >= totalMaterialsPages"
              type="button"
              class="px-2.5 py-1 rounded-lg border border-[#4A5D23]/20 bg-white text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
              aria-label="Página siguiente de insumos"
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

<style scoped>
/* Ocultar completamente la barra de scroll nativa horizontal (gris con flechas) en móviles y navegadores */
.hide-scrollbar::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.hide-scrollbar {
  -ms-overflow-style: none !important; /* IE y Edge */
  scrollbar-width: none !important; /* Firefox */
}
</style>
