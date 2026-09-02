<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAsyncData } from 'nuxt/app'
import { useCartStore } from '~/stores/cart'
import { toast } from 'vue-sonner'

const cartStore = useCartStore()

interface Product {
  id: string | number
  name: string
  price: number | string
  stock: number
  image_url?: string | null
  description?: string
}

interface ApiResponse {
  success: boolean
  count: number
  data: Product[]
}

const { data: catalog, pending, error } = await useAsyncData(
  'products-catalog',
  () => $fetch<ApiResponse>('/api/products'),
  {
    default: () => ({ success: true, count: 0, data: [] })
  }
)

const searchQuery = ref('')
const selectedCategory = ref('todos')

const categories = [
  { id: 'todos', name: 'Todos los Postres', icon: 'lucide:sparkles' },
  { id: 'tortas', name: 'Tortas & Pasteles', icon: 'lucide:cake' },
  { id: 'tartaletas', name: 'Tartaletas & Pies', icon: 'lucide:pie-chart' },
  { id: 'cheesecakes', name: 'Cheesecakes', icon: 'lucide:heart' },
  { id: 'bocaditos', name: 'Boxes & Porciones', icon: 'lucide:box' }
]

function normalizeText(text: string) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const filteredProducts = computed(() => {
  const list = catalog.value?.data || []
  if (!Array.isArray(list) || list.length === 0) return []
  
  const q = normalizeText(searchQuery.value)
  const cat = selectedCategory.value

  return list.filter((product: Product) => {
    if (!product || !product.name) return false
    const nameNorm = normalizeText(product.name)
    const descNorm = normalizeText(product.description || '')

    // 1. Búsqueda por texto (nombre o descripción)
    if (q.length > 0) {
      const matchesSearch = nameNorm.includes(q) || descNorm.includes(q)
      if (!matchesSearch) return false
    }

    // 2. Filtro por categoría
    if (cat === 'todos') return true
    if (cat === 'tortas') return nameNorm.includes('torta') || nameNorm.includes('pastel') || nameNorm.includes('cake')
    if (cat === 'tartaletas') return nameNorm.includes('tarta') || nameNorm.includes('pie')
    if (cat === 'cheesecakes') return nameNorm.includes('cheesecake') || nameNorm.includes('cheese')
    if (cat === 'bocaditos') return nameNorm.includes('box') || nameNorm.includes('alfajor') || nameNorm.includes('brownie') || nameNorm.includes('cajita')
    
    return true
  })
})

function handleAddToCart(product: Product) {
  cartStore.addToCart(product)
  toast.success('¡Agregado al pedido!', {
    description: `${product.name} — S/ ${Number(product.price).toFixed(2)}`
  })
}

function getProductImage(product: Product) {
  if (product.image_url && product.image_url.trim() !== '') {
    return product.image_url
  }
  const name = (product.name || '').toLowerCase()
  if (name.includes('torta') || name.includes('chocolate')) {
    return '/images/desserts/torta-chocolate-frutos.jpg'
  }
  if (name.includes('tarta') || name.includes('fresa') || name.includes('pistacho')) {
    return '/images/desserts/tartaleta-fresas-pistacho.jpg'
  }
  return '/images/desserts/torta-chocolate-frutos.jpg'
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 lg:px-12 py-10 w-full">
    
    <!-- Page Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest mb-3 border border-brand-primary/20">
        <Icon name="lucide:sparkles" class="w-3.5 h-3.5" />
        Vitrina Comercial
      </div>
      <h2 class="text-4xl md:text-5xl font-playfair font-black text-brand-secondary mb-3 tracking-tight">
        Nuestra Colección Artesanal
      </h2>
      <p class="text-sm text-brand-primary/80 font-medium max-w-lg mx-auto leading-relaxed">
        Descubre nuestra selección de postres de autor elaborados diariamente con insumos naturales de primera calidad.
      </p>
    </div>

    <!-- Search & Filters -->
    <div class="mb-10 space-y-4 max-w-3xl mx-auto">
      <!-- Search bar -->
      <div class="relative w-full">
        <Icon name="lucide:search" class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/60 pointer-events-none" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por nombre o sabor (ej. chocolate, fresa, torta, brownie, alfajores)..." 
          class="w-full pl-12 pr-10 py-3.5 bg-surface rounded-2xl border border-brand-primary/25 text-sm font-semibold text-brand-secondary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-soft-sm"
        />
        <button 
          v-if="searchQuery" 
          @click="searchQuery = ''"
          type="button"
          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-primary/50 hover:text-status-danger p-1 cursor-pointer"
          title="Limpiar búsqueda"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Category Pills -->
      <div class="flex items-center justify-center gap-2 overflow-x-auto py-1 hide-scrollbar">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          type="button"
          :class="[
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer',
            selectedCategory === cat.id
              ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm scale-102'
              : 'bg-surface text-brand-secondary border-brand-primary/15 hover:bg-brand-cream shadow-soft-sm'
          ]"
        >
          <Icon :name="cat.icon" class="w-3.5 h-3.5" />
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- State: Loading -->
    <div v-if="pending" class="flex flex-col items-center justify-center py-24">
      <div class="relative w-12 h-12 mb-4 text-brand-primary">
         <Icon name="lucide:loader-2" class="w-full h-full animate-spin" />
      </div>
      <p class="text-xs font-bold tracking-widest uppercase text-brand-primary animate-pulse">Cargando vitrina...</p>
    </div>

    <!-- State: Error -->
    <div v-else-if="error" class="max-w-2xl mx-auto bg-surface border border-status-danger/20 text-status-danger px-8 py-8 rounded-2xl flex items-start gap-5 shadow-soft-sm">
      <Icon name="lucide:triangle-alert" class="w-6 h-6 text-status-danger shrink-0 mt-1" />
      <div>
        <h3 class="text-lg font-playfair font-bold mb-1 tracking-tight">Ocurrió un error al cargar</h3>
        <p class="text-sm font-medium leading-relaxed font-inter">{{ error.message }}</p>
      </div>
    </div>

    <!-- State: Empty Search -->
    <div v-else-if="filteredProducts.length === 0" class="max-w-xl mx-auto text-center py-16 bg-surface rounded-[2.5rem] shadow-soft-md border border-brand-primary/15 p-8">
      <div class="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center mx-auto mb-4 text-brand-primary">
        <Icon name="lucide:search-x" class="w-8 h-8" />
      </div>
      <h3 class="text-2xl font-playfair font-bold text-brand-secondary mb-2 tracking-tight">Sin resultados</h3>
      <p class="text-brand-primary/80 font-medium text-xs max-w-sm mx-auto leading-relaxed mb-6">
        No encontramos ningún postre para "{{ searchQuery }}". Prueba buscando con otra palabra o seleccionando "Todos los Postres".
      </p>
      <button 
        @click="searchQuery = ''; selectedCategory = 'todos'"
        type="button"
        class="px-6 py-2.5 bg-brand-primary text-white rounded-full text-xs font-bold hover:bg-brand-secondary transition-all shadow-soft-sm cursor-pointer"
      >
        Ver Todos los Postres
      </button>
    </div>

    <!-- State: Grid with Smooth Transitions -->
    <TransitionGroup
      v-else
      name="list"
      tag="div"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 relative"
    >
      <article
        v-for="product in filteredProducts"
        :key="product.id"
        class="group bg-surface rounded-[2rem] overflow-hidden shadow-soft-sm hover:shadow-soft-lg transition-all duration-300 flex flex-col border border-brand-primary/10 hover:-translate-y-1.5"
      >
        <!-- Image Container -->
        <div class="h-64 w-full relative overflow-hidden bg-brand-cream/60">
          <!-- Badges -->
          <div 
            v-if="product.stock <= 5 && product.stock > 0" 
            class="absolute top-4 right-4 z-20 bg-status-danger/95 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            Últimos {{ product.stock }}
          </div>
          <div 
            v-else-if="product.stock === 0" 
            class="absolute top-4 right-4 z-20 bg-brand-secondary/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm"
          >
            Bajo Pedido
          </div>

          <!-- Image with smooth zoom -->
          <img 
            :src="getProductImage(product)" 
            :alt="product.name" 
            class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
          />
        </div>

        <!-- Content -->
        <div class="p-6 flex-1 flex flex-col justify-between bg-surface">
          <div>
            <h3 class="text-xl font-playfair font-bold text-brand-secondary mb-2 tracking-tight leading-snug">
              {{ product.name }}
            </h3>
            <p class="text-xs text-brand-primary/75 line-clamp-2 leading-relaxed mb-6 font-medium">
              {{ product.description || 'Elaborado artesanalmente con recetas tradicionales e insumos naturales seleccionados.' }}
            </p>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-brand-primary/10 mt-auto">
            <div class="flex items-baseline gap-1">
              <span class="text-xs font-bold text-brand-primary uppercase tracking-widest">S/</span>
              <span class="text-2xl font-inter font-black tracking-tight text-brand-secondary">{{ Number(product.price).toFixed(2) }}</span>
            </div>
            
            <button
              @click="handleAddToCart(product)"
              type="button"
              :disabled="Number(product.price) <= 0"
              :class="[
                'h-11 px-5 rounded-full flex items-center gap-2 transition-all duration-300 shadow-soft-sm cursor-pointer',
                Number(product.price) > 0
                  ? 'bg-brand-primary text-white hover:bg-brand-secondary hover:shadow-soft-md active:scale-95'
                  : 'bg-brand-cream text-brand-primary/40 cursor-not-allowed'
              ]"
              :title="Number(product.price) > 0 ? 'Agregar al pedido' : 'Precio no disponible'"
            >
              <span class="text-xs font-bold font-inter">Pedir</span>
              <Icon name="lucide:shopping-bag" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    </TransitionGroup>

  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
