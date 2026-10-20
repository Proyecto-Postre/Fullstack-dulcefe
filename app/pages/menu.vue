<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAsyncData, useRoute, useRouter } from 'nuxt/app'
import type { CatalogApiResponse, CatalogProduct, CatalogCategory } from '~/types/catalog'
import { useCatalog } from '~/composables/useCatalog'
import { useCartStore } from '~/stores/cart'
import CatalogHeader from '~/components/catalog/CatalogHeader.vue'
import CatalogSearchFilter from '~/components/catalog/CatalogSearchFilter.vue'
import CatalogProductCard from '~/components/catalog/CatalogProductCard.vue'
import CatalogEmptyState from '~/components/catalog/CatalogEmptyState.vue'
import CatalogLoadingSkeleton from '~/components/catalog/CatalogLoadingSkeleton.vue'
import ProductDetailModal from '~/components/catalog/ProductDetailModal.vue'
import AnimatedGrid from '~/components/ui/AnimatedGrid.vue'

const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()

const { data: catalogResponse, pending, error, refresh } = await useAsyncData(
  'products-catalog',
  () => $fetch<CatalogApiResponse>('/api/products'),
  {
    default: () => ({ success: true, count: 0, data: [] })
  }
)

const { data: categoriesResponse } = await useAsyncData(
  'categories-catalog',
  () => $fetch<{ success: boolean; data: CatalogCategory[] }>('/api/categories'),
  {
    default: () => ({ success: true, data: [] })
  }
)

const rawProducts = computed<CatalogProduct[]>(() => {
  return catalogResponse.value?.data || []
})

const rawCategories = computed<CatalogCategory[]>(() => {
  return categoriesResponse.value?.data || []
})

const {
  searchQuery,
  selectedCategory,
  selectedCategories,
  categories,
  filteredProducts,
  groupedSections,
  isAllSelected,
  toggleCategory,
  setOnlyCategory,
  handleAddToCart,
  getProductImage,
  resetFilters
} = useCatalog(rawProducts, rawCategories)

// Sincronización con Query Params de la URL (para accesos directos desde el Home)
if (route.query.q) {
  searchQuery.value = String(route.query.q)
}
if (route.query.cat) {
  setOnlyCategory(String(route.query.cat))
}

watch(() => route.query, (q) => {
  if (q.q !== undefined) searchQuery.value = String(q.q || '')
  if (q.cat !== undefined) setOnlyCategory(String(q.cat || 'todos'))
})

// Estado del Modal de Detalle y sincronización de URL (?producto=ID)
const selectedProductForDetail = ref<CatalogProduct | null>(null)
const isDetailModalOpen = ref(false)

function openProductDetail(product: CatalogProduct) {
  selectedProductForDetail.value = product
  isDetailModalOpen.value = true
  router.replace({
    query: { ...route.query, producto: String(product.id) }
  })
}

function closeProductDetail() {
  isDetailModalOpen.value = false
  selectedProductForDetail.value = null
  if (route.query.producto) {
    const { producto: _, ...rest } = route.query
    router.replace({ query: rest })
  }
}

// Deep-linking inicial: si la URL contiene ?producto=ID, abrir automáticamente
watch([rawProducts, () => route.query.producto], ([products, prodId]) => {
  if (prodId && Array.isArray(products) && products.length > 0) {
    const match = products.find(p => String(p.id) === String(prodId))
    if (match) {
      selectedProductForDetail.value = match
      isDetailModalOpen.value = true
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-24 sm:pb-12 w-full relative overflow-x-clip">
    <!-- Encabezado de Vitrina Editorial -->
    <CatalogHeader />

    <!-- Barra de Búsqueda y Selector Desplegable Único -->
    <CatalogSearchFilter
      :search-query="searchQuery"
      :selected-category="selectedCategory"
      :selected-categories="selectedCategories"
      :categories="categories"
      @update:search-query="searchQuery = $event"
      @update:selected-category="selectedCategory = $event"
      @update:selected-categories="selectedCategories = $event"
      @toggle-category="toggleCategory"
    />

    <!-- Estado: Cargando -->
    <CatalogLoadingSkeleton v-if="pending" />

    <!-- Estado: Error con Recuperación Graceful -->
    <div 
      v-else-if="error" 
      class="max-w-2xl mx-auto bg-surface border border-status-danger/20 text-status-danger px-6 sm:px-8 py-8 rounded-3xl flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-soft-sm text-center sm:text-left"
    >
      <div class="w-12 h-12 rounded-full bg-status-danger/10 flex items-center justify-center shrink-0">
        <Icon name="lucide:triangle-alert" class="w-6 h-6 text-status-danger" />
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-playfair font-bold mb-1 tracking-tight">Ocurrió un inconveniente al cargar la carta</h3>
        <p class="text-xs sm:text-sm text-brand-secondary/80 font-medium leading-relaxed mb-4">
          No pudimos conectar con el servidor temporalmente. Por favor, reintenta o comunícate directamente con nuestro taller por WhatsApp.
        </p>
        <button
          @click="() => refresh()"
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-primary text-white text-xs font-bold shadow-soft-sm hover:bg-brand-secondary transition-all active:scale-95 cursor-pointer"
        >
          <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" />
          <span>Reintentar Carga</span>
        </button>
      </div>
    </div>

    <!-- Estado: Búsqueda sin resultados -->
    <CatalogEmptyState
      v-else-if="filteredProducts.length === 0"
      :search-query="searchQuery"
      @reset="resetFilters"
    />

    <!-- Estado: Catálogo Activo (Organizado por Secciones Dinámicas) -->
    <div v-else class="space-y-8 sm:space-y-12">

      <!-- CASO A: Categoría Específica Única Seleccionada (Vista Directa en Cuadrícula) -->
      <div v-if="!isAllSelected && selectedCategories.length === 1" class="space-y-4 sm:space-y-6">
        <div class="flex items-center justify-between border-b border-brand-primary/10 pb-3">
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-brand-cream text-brand-primary flex items-center justify-center border border-brand-primary/15 shrink-0">
              <Icon :name="groupedSections?.[0]?.icon || 'lucide:cake'" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="font-playfair font-bold text-lg sm:text-2xl text-brand-secondary leading-tight truncate">
                {{ groupedSections?.[0]?.name || 'Selección' }}
              </h2>
              <span class="text-[11px] font-bold text-brand-primary/70">
                {{ filteredProducts.length }} postres disponibles
              </span>
            </div>
          </div>
          <button
            @click="setOnlyCategory('todos')"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-primary/20 text-xs font-bold text-brand-secondary hover:bg-brand-cream transition-colors cursor-pointer shrink-0"
          >
            <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Ver toda la carta</span>
            <span class="sm:hidden">Todos</span>
          </button>
        </div>

        <AnimatedGrid
          :items="filteredProducts"
          grid-class="grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-7"
        >
          <template #default="{ item: product }">
            <CatalogProductCard
              :product="product"
              :image-url="getProductImage(product)"
              @add-to-cart="handleAddToCart"
              @view-detail="openProductDetail"
            />
          </template>
        </AnimatedGrid>
      </div>

      <!-- CASO B: Vista 'Todos' o Selección Múltiple (Secciones con Carrusel en Mobile y Grid en Desktop) -->
      <div v-else class="space-y-8 sm:space-y-12">
        <section
          v-for="section in groupedSections"
          :key="section.id"
          class="space-y-3 sm:space-y-4"
        >
          <!-- Encabezado de la Sección: amplio, holgado y con flecha circular minimalista -->
          <div class="flex items-center justify-between border-b border-brand-primary/10 pb-2">
            <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
              <div class="w-8 h-8 rounded-xl bg-brand-cream text-brand-primary flex items-center justify-center border border-brand-primary/15 shrink-0">
                <Icon :name="section.icon" class="w-4 h-4" />
              </div>
              <h2 class="font-playfair font-bold text-base sm:text-xl text-brand-secondary leading-tight truncate">
                {{ section.name }}
              </h2>
              <span class="text-[10px] font-bold text-brand-primary bg-brand-cream/80 px-2 py-0.5 rounded-full border border-brand-primary/15 shrink-0">
                {{ section.products.length }}
              </span>
            </div>

            <!-- Botón de acceso directo a la sección: flecha circular minimalista que nunca aprieta el título -->
            <button
              v-if="section.id !== 'otras'"
              @click="setOnlyCategory(section.id)"
              type="button"
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-cream/80 hover:bg-brand-primary hover:text-white text-brand-primary border border-brand-primary/15 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 group shadow-soft-sm"
              :aria-label="`Ver solo ${section.name}`"
              :title="`Ver solo ${section.name}`"
            >
              <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <!-- Disposición Móvil: Carrusel Horizontal Calibrado (2 tarjetas completas simétricas + peek sutil de la 3ra en cualquier modelo) -->
          <div class="block sm:hidden -mx-4 px-4 overflow-x-auto overflow-y-hidden flex gap-2.5 snap-x snap-mandatory scroll-px-4 hide-scrollbar pb-3 pt-1">
            <div
              v-for="product in section.products"
              :key="product.id"
              class="w-[calc((100vw-70px)/2)] min-w-[140px] max-w-[200px] shrink-0 snap-start flex flex-col h-auto"
            >
              <CatalogProductCard
                :product="product"
                :image-url="getProductImage(product)"
                @add-to-cart="handleAddToCart"
                @view-detail="openProductDetail"
              />
            </div>
            <!-- Espaciador de cierre para conservar margen derecho al llegar al final -->
            <div class="w-2 shrink-0" aria-hidden="true"></div>
          </div>

          <!-- Disposición Desktop / Tablet: Cuadrícula Completa de 2 a 4 Columnas -->
          <div class="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-7">
            <CatalogProductCard
              v-for="product in section.products"
              :key="product.id"
              :product="product"
              :image-url="getProductImage(product)"
              @add-to-cart="handleAddToCart"
              @view-detail="openProductDetail"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- Modal de Detalle de Producto -->
    <ProductDetailModal
      :product="selectedProductForDetail"
      :is-open="isDetailModalOpen"
      :image-url="selectedProductForDetail ? getProductImage(selectedProductForDetail) : ''"
      @close="closeProductDetail"
      @add-to-cart="handleAddToCart"
    />

    <!-- Barra Flotante de Carrito en Móvil (Conversión E-commerce) -->
    <div 
      v-if="cartStore.cartItemCount > 0" 
      class="sm:hidden fixed bottom-4 left-4 right-4 z-30 animate-pop"
    >
      <button
        type="button"
        @click="cartStore.openDrawer()"
        class="w-full bg-[#2A321B]/95 hover:bg-[#4A5D23] text-white backdrop-blur-md px-4 py-3 rounded-full shadow-2xl flex items-center justify-between border border-[#F4F1E1]/20 active:scale-98 transition-all duration-300 cursor-pointer"
        aria-label="Abrir carrito de compras"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-[#4A5D23] flex items-center justify-center text-white shrink-0">
            <Icon name="lucide:shopping-bag" class="w-4 h-4" />
          </div>
          <div class="text-left leading-tight">
            <p class="text-[11px] font-bold text-[#F4F1E1]/90">
              {{ cartStore.cartItemCount }} {{ cartStore.cartItemCount === 1 ? 'postre' : 'postres' }} en tu pedido
            </p>
            <p class="text-sm font-black font-inter text-white">
              S/ {{ cartStore.cartTotal.toFixed(2) }}
            </p>
          </div>
        </div>

        <span class="inline-flex items-center gap-1.5 text-xs font-black bg-[#F4F1E1] text-[#2A321B] px-3.5 py-1.5 rounded-full shadow-sm">
          <span>Ver Pedido</span>
          <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
        </span>
      </button>
    </div>
  </div>
</template>
