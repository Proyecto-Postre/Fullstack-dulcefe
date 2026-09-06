<script setup lang="ts">
import { computed } from 'vue'
import { useAsyncData } from 'nuxt/app'
import type { CatalogApiResponse, CatalogProduct } from '~/types/catalog'
import { useCatalog } from '~/composables/useCatalog'
import CatalogHeader from '~/components/catalog/CatalogHeader.vue'
import CatalogSearchFilter from '~/components/catalog/CatalogSearchFilter.vue'
import CatalogProductCard from '~/components/catalog/CatalogProductCard.vue'
import CatalogEmptyState from '~/components/catalog/CatalogEmptyState.vue'
import CatalogLoadingSkeleton from '~/components/catalog/CatalogLoadingSkeleton.vue'

const { data: catalogResponse, pending, error } = await useAsyncData(
  'products-catalog',
  () => $fetch<CatalogApiResponse>('/api/products'),
  {
    default: () => ({ success: true, count: 0, data: [] })
  }
)

const rawProducts = computed<CatalogProduct[]>(() => {
  return catalogResponse.value?.data || []
})

const {
  searchQuery,
  selectedCategory,
  categories,
  filteredProducts,
  handleAddToCart,
  getProductImage,
  resetFilters
} = useCatalog(rawProducts)
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 lg:px-12 py-10 w-full">
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

    <!-- Estado: Error -->
    <div 
      v-else-if="error" 
      class="max-w-2xl mx-auto bg-surface border border-status-danger/20 text-status-danger px-8 py-8 rounded-2xl flex items-start gap-5 shadow-soft-sm"
    >
      <Icon name="lucide:triangle-alert" class="w-6 h-6 text-status-danger shrink-0 mt-1" />
      <div>
        <h3 class="text-lg font-playfair font-bold mb-1 tracking-tight">Ocurrió un error al cargar</h3>
        <p class="text-sm font-medium leading-relaxed font-inter">{{ error.message }}</p>
      </div>
    </div>

    <!-- Estado: Búsqueda sin resultados -->
    <CatalogEmptyState
      v-else-if="filteredProducts.length === 0"
      :search-query="searchQuery"
      @reset="resetFilters"
    />

    <!-- Estado: Cuadrícula de Productos -->
    <TransitionGroup
      v-else
      name="list"
      tag="div"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 relative"
    >
      <CatalogProductCard
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
        :image-url="getProductImage(product)"
        @add-to-cart="handleAddToCart"
      />
    </TransitionGroup>
  </div>
</template>
