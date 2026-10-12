<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAsyncData } from 'nuxt/app'
import type { CatalogApiResponse, CatalogProduct, CatalogCategory } from '~/types/catalog'
import { useCatalog } from '~/composables/useCatalog'
import CatalogHeader from '~/components/catalog/CatalogHeader.vue'
import CatalogSearchFilter from '~/components/catalog/CatalogSearchFilter.vue'
import CatalogProductCard from '~/components/catalog/CatalogProductCard.vue'
import CatalogEmptyState from '~/components/catalog/CatalogEmptyState.vue'
import CatalogLoadingSkeleton from '~/components/catalog/CatalogLoadingSkeleton.vue'
import ProductDetailModal from '~/components/catalog/ProductDetailModal.vue'
import AnimatedGrid from '~/components/ui/AnimatedGrid.vue'

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
  categories,
  filteredProducts,
  handleAddToCart,
  getProductImage,
  resetFilters
} = useCatalog(rawProducts, rawCategories)

// Sincronización con Query Params de la URL (para accesos directos desde el Home)
const route = useRoute()
if (route.query.q) {
  searchQuery.value = String(route.query.q)
}
if (route.query.cat) {
  selectedCategory.value = String(route.query.cat)
}

watch(() => route.query, (q) => {
  if (q.q !== undefined) searchQuery.value = String(q.q || '')
  if (q.cat !== undefined) selectedCategory.value = String(q.cat || 'todos')
})

// Estado del Modal de Detalle
const selectedProductForDetail = ref<CatalogProduct | null>(null)
const isDetailModalOpen = ref(false)

function openProductDetail(product: CatalogProduct) {
  selectedProductForDetail.value = product
  isDetailModalOpen.value = true
}

function closeProductDetail() {
  isDetailModalOpen.value = false
  selectedProductForDetail.value = null
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-12 w-full">
    <!-- Encabezado de Vitrina -->
    <CatalogHeader />

    <!-- Barra de Búsqueda y Píldoras de Categoría -->
    <CatalogSearchFilter
      :search-query="searchQuery"
      :selected-category="selectedCategory"
      :categories="categories"
      @update:search-query="searchQuery = $event"
      @update:selected-category="selectedCategory = $event"
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

    <!-- Estado: Cuadrícula de Productos con Deslizamiento Suave FLIP -->
    <AnimatedGrid
      v-else
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

    <!-- Modal de Detalle de Producto -->
    <ProductDetailModal
      :product="selectedProductForDetail"
      :is-open="isDetailModalOpen"
      :image-url="selectedProductForDetail ? getProductImage(selectedProductForDetail) : ''"
      @close="closeProductDetail"
      @add-to-cart="handleAddToCart"
    />
  </div>
</template>
