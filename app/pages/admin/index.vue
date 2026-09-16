<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminTab, TAB_TO_SLUG, SLUG_TO_TAB } from '~/composables/admin/useAdminNavState'
import type { Database } from '~/types/database.types'

type ProductItem = Database['public']['Tables']['products']['Row']
type MaterialItem = Database['public']['Tables']['raw_materials']['Row']

// Layout administrativo y protección de ruta
definePageMeta({
  layout: 'admin',
  middleware: 'admin-only'
})

const route = useRoute()
const router = useRouter()

// Control de pestañas del panel sincronizado con el layout
const currentTab = useAdminTab()

// Sincronizar pestaña inicial desde los query params de la URL si existen (ej. /admin?tab=almacen)
const initialQueryTab = route.query.tab as string | undefined
if (initialQueryTab && SLUG_TO_TAB[initialQueryTab]) {
  currentTab.value = SLUG_TO_TAB[initialQueryTab]
} else if (currentTab.value && currentTab.value !== 'dashboard' && !route.query.tab) {
  router.replace({ query: { ...route.query, tab: TAB_TO_SLUG[currentTab.value] } })
}

// Observar cambios reactivos en la pestaña para actualizar la URL sin recargar la página (SPA pushState)
watch(currentTab, (newTab) => {
  const targetSlug = TAB_TO_SLUG[newTab]
  if (route.query.tab !== targetSlug) {
    if (newTab === 'dashboard') {
      const { tab: _, ...restQuery } = route.query
      router.push({ query: restQuery })
    } else {
      router.push({ query: { ...route.query, tab: targetSlug } })
    }
  }
})

// Responder a los botones Atrás / Adelante del navegador
watch(() => route.query.tab, (newQueryTab) => {
  if (typeof newQueryTab === 'string' && SLUG_TO_TAB[newQueryTab]) {
    const matched = SLUG_TO_TAB[newQueryTab]
    if (currentTab.value !== matched) {
      currentTab.value = matched
    }
  } else if (!newQueryTab && currentTab.value !== 'dashboard') {
    currentTab.value = 'dashboard'
  }
})

// Consultas globales a la API (Productos e Insumos)
const { data: catalog, refresh: refreshCatalog, pending: pendingCatalog } = await useFetch<{ success: boolean, data: ProductItem[] }>('/api/products')
const { data: materials, refresh: refreshMaterials, pending: pendingMaterials } = await useFetch<{ success: boolean, data: MaterialItem[] }>('/api/raw-materials')

// Estado compartido para la pestaña de Recetas
const activeProductForRecipe = ref<ProductItem | null>(null)

function goToRecipeTab(product: ProductItem) {
  activeProductForRecipe.value = product
  currentTab.value = 'recipes'
}
</script>

<template>
  <div class="h-full w-full grid grid-cols-1 lg:grid-cols-[280px_1fr] overflow-hidden">
    
    <!-- Sidebar (Desktop - Pegado a la izquierda) -->
    <aside class="hidden lg:flex flex-col col-span-1 bg-surface border-r border-brand-primary/10 relative z-20 overflow-hidden">
      <!-- Decorative Background -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-cream to-transparent rounded-bl-full"></div>
        <Icon name="lucide:leaf" class="absolute -bottom-10 -left-10 w-48 h-48 text-brand-primary/[0.02] -rotate-45" />
      </div>

      <div class="p-6 flex flex-col gap-2 flex-1 overflow-y-auto hide-scrollbar relative z-10">
        <p class="text-[10px] font-black text-brand-primary/60 uppercase tracking-[0.2em] mb-4 px-2">Menú Principal</p>
        
        <button 
          @click="currentTab = 'dashboard'"
          type="button"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group cursor-pointer text-sm',
            currentTab === 'dashboard' ? 'bg-brand-cream text-brand-primary border-brand-primary/20 shadow-soft-sm' : 'bg-transparent text-brand-secondary border-transparent hover:bg-brand-cream/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-brand-primary transition-transform duration-300', currentTab === 'dashboard' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:layout-dashboard" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'dashboard' ? 'scale-110' : 'group-hover:scale-110']" />
          Dashboard
        </button>

        <button 
          @click="currentTab = 'products'"
          type="button"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group cursor-pointer text-sm',
            currentTab === 'products' ? 'bg-brand-cream text-brand-primary border-brand-primary/20 shadow-soft-sm' : 'bg-transparent text-brand-secondary border-transparent hover:bg-brand-cream/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-brand-primary transition-transform duration-300', currentTab === 'products' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:cake-slice" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'products' ? 'scale-110' : 'group-hover:scale-110']" />
          Vitrina Comercial
        </button>

        <button 
          @click="currentTab = 'materials'"
          type="button"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group cursor-pointer text-sm',
            currentTab === 'materials' ? 'bg-brand-cream text-brand-primary border-brand-primary/20 shadow-soft-sm' : 'bg-transparent text-brand-secondary border-transparent hover:bg-brand-cream/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-brand-primary transition-transform duration-300', currentTab === 'materials' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:scale" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'materials' ? 'scale-110' : 'group-hover:scale-110']" />
          Almacén de Insumos
        </button>

        <button 
          @click="currentTab = 'recipes'"
          type="button"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group cursor-pointer text-sm',
            currentTab === 'recipes' ? 'bg-brand-cream text-brand-primary border-brand-primary/20 shadow-soft-sm' : 'bg-transparent text-brand-secondary border-transparent hover:bg-brand-cream/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-brand-primary transition-transform duration-300', currentTab === 'recipes' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:calculator" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'recipes' ? 'scale-110' : 'group-hover:scale-110']" />
          Escandallo
        </button>

        <button 
          @click="currentTab = 'orders'"
          type="button"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group cursor-pointer text-sm',
            currentTab === 'orders' ? 'bg-brand-cream text-brand-primary border-brand-primary/20 shadow-soft-sm' : 'bg-transparent text-brand-secondary border-transparent hover:bg-brand-cream/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-brand-primary transition-transform duration-300', currentTab === 'orders' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:clipboard-list" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'orders' ? 'scale-110' : 'group-hover:scale-110']" />
          Gestión de Pedidos
        </button>

        <NuxtLink
          to="/admin/kds"
          class="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-300/40 text-left w-full relative overflow-hidden group cursor-pointer text-sm transition-all shadow-soft-sm mt-2"
        >
          <Icon name="lucide:chef-hat" class="w-5 h-5 text-amber-600 transition-transform duration-300 group-hover:scale-110" />
          <span>KDS Cocina / Taller</span>
          <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 ml-auto text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </NuxtLink>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="col-span-1 relative z-10 overflow-hidden flex flex-col bg-transparent">
      <div class="flex-1 overflow-y-auto hide-scrollbar py-3 sm:py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <!-- Componentes de Pestaña -->
        <AdminDashboardTab 
          v-if="currentTab === 'dashboard'" 
          :catalog="catalog"
          :materials="materials"
          @refresh="() => { refreshCatalog(); refreshMaterials(); }"
        />

        <AdminProductsTab 
          v-if="currentTab === 'products'" 
          :catalog="catalog" 
          :pendingCatalog="pendingCatalog"
          @refresh="refreshCatalog"
          @view-recipe="goToRecipeTab"
        />

        <AdminMaterialsTab 
          v-if="currentTab === 'materials'" 
          :materials="materials" 
          :pendingMaterials="pendingMaterials"
          @refresh="refreshMaterials"
        />

        <AdminRecipesTab 
          v-if="currentTab === 'recipes'"
          :catalog="catalog"
          :materials="materials"
          v-model="activeProductForRecipe"
          @refresh-catalog="refreshCatalog"
        />

        <AdminOrdersTab 
          v-if="currentTab === 'orders'"
        />
      </div>
    </main>
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
