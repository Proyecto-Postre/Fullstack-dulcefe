<script setup lang="ts">
import { ref } from 'vue'
import type { Database } from '~/types/database.types'

type ProductItem = Database['public']['Tables']['products']['Row']
type MaterialItem = Database['public']['Tables']['raw_materials']['Row']

// Layout administrativo y protección de ruta
definePageMeta({
  layout: 'admin',
  middleware: 'admin-only'
})

// Control de pestañas del panel
const currentTab = ref<'dashboard' | 'products' | 'materials' | 'recipes' | 'orders'>('dashboard')

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
  <div class="h-full w-full grid grid-cols-1 lg:grid-cols-[280px_1fr] grid-rows-[auto_1fr] lg:grid-rows-1 overflow-hidden">
    
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
          target="_blank"
          class="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-300/40 text-left w-full relative overflow-hidden group cursor-pointer text-sm transition-all shadow-soft-sm mt-2"
        >
          <Icon name="lucide:chef-hat" class="w-5 h-5 text-amber-600 transition-transform duration-300 group-hover:scale-110" />
          <span>KDS Cocina / Taller</span>
          <Icon name="lucide:external-link" class="w-3.5 h-3.5 ml-auto text-amber-500" />
        </NuxtLink>

        <a
          href="/marketing/carta-menu/index.html"
          target="_blank"
          class="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/40 text-left w-full relative overflow-hidden group cursor-pointer text-sm transition-all shadow-soft-sm mt-1"
        >
          <Icon name="lucide:book-open" class="w-5 h-5 text-emerald-700 transition-transform duration-300 group-hover:scale-110" />
          <span>Carta Digital / Menú</span>
          <Icon name="lucide:external-link" class="w-3.5 h-3.5 ml-auto text-emerald-600" />
        </a>
      </div>
    </aside>

    <!-- Navegación Móvil (Horizontal) -->
    <div class="lg:hidden col-span-full row-span-1 relative z-20 bg-surface border-b border-brand-primary/10">
      <div class="flex space-x-2 p-3 overflow-x-auto hide-scrollbar">
        <button 
          @click="currentTab = 'dashboard'"
          type="button"
          :class="[
            'flex items-center gap-2 py-2 px-3.5 font-bold text-xs rounded-xl transition-all duration-300 border whitespace-nowrap cursor-pointer',
            currentTab === 'dashboard' 
              ? 'bg-brand-cream border-brand-primary/20 text-brand-primary shadow-soft-sm' 
              : 'bg-transparent border-transparent text-brand-secondary hover:bg-brand-cream/50'
          ]"
        >
          <Icon name="lucide:layout-dashboard" class="w-4 h-4" />
          Dashboard
        </button>

        <button 
          @click="currentTab = 'products'"
          type="button"
          :class="[
            'flex items-center gap-2 py-2 px-3.5 font-bold text-xs rounded-xl transition-all duration-300 border whitespace-nowrap cursor-pointer',
            currentTab === 'products' 
              ? 'bg-brand-cream border-brand-primary/20 text-brand-primary shadow-soft-sm' 
              : 'bg-transparent border-transparent text-brand-secondary hover:bg-brand-cream/50'
          ]"
        >
          <Icon name="lucide:cake-slice" class="w-4 h-4" />
          Vitrina
        </button>

        <button 
          @click="currentTab = 'materials'"
          type="button"
          :class="[
            'flex items-center gap-2 py-2 px-3.5 font-bold text-xs rounded-xl transition-all duration-300 border whitespace-nowrap cursor-pointer',
            currentTab === 'materials' 
              ? 'bg-brand-cream border-brand-primary/20 text-brand-primary shadow-soft-sm' 
              : 'bg-transparent border-transparent text-brand-secondary hover:bg-brand-cream/50'
          ]"
        >
          <Icon name="lucide:scale" class="w-4 h-4" />
          Almacén
        </button>

        <button 
          @click="currentTab = 'recipes'"
          type="button"
          :class="[
            'flex items-center gap-2 py-2 px-3.5 font-bold text-xs rounded-xl transition-all duration-300 border whitespace-nowrap cursor-pointer',
            currentTab === 'recipes' 
              ? 'bg-brand-cream border-brand-primary/20 text-brand-primary shadow-soft-sm' 
              : 'bg-transparent border-transparent text-brand-secondary hover:bg-brand-cream/50'
          ]"
        >
          <Icon name="lucide:calculator" class="w-4 h-4" />
          Escandallo
        </button>

        <button 
          @click="currentTab = 'orders'"
          type="button"
          :class="[
            'flex items-center gap-2 py-2 px-3.5 font-bold text-xs rounded-xl transition-all duration-300 border whitespace-nowrap cursor-pointer',
            currentTab === 'orders' 
              ? 'bg-brand-cream border-brand-primary/20 text-brand-primary shadow-soft-sm' 
              : 'bg-transparent border-transparent text-brand-secondary hover:bg-brand-cream/50'
          ]"
        >
          <Icon name="lucide:clipboard-list" class="w-4 h-4" />
          Pedidos
        </button>

        <NuxtLink
          to="/admin/kds"
          target="_blank"
          class="flex items-center gap-2 py-2 px-3.5 font-bold text-xs rounded-xl transition-all duration-300 border border-amber-300/40 bg-amber-50 text-amber-700 whitespace-nowrap cursor-pointer hover:bg-amber-100"
        >
          <Icon name="lucide:chef-hat" class="w-4 h-4 text-amber-600" />
          KDS Taller
        </NuxtLink>

        <a
          href="/marketing/carta-menu/index.html"
          target="_blank"
          class="flex items-center gap-2 py-2 px-3.5 font-bold text-xs rounded-xl transition-all duration-300 border border-emerald-300/40 bg-emerald-50 text-emerald-800 whitespace-nowrap cursor-pointer hover:bg-emerald-100"
        >
          <Icon name="lucide:book-open" class="w-4 h-4 text-emerald-700" />
          Carta Menú
        </a>
      </div>
    </div>

    <!-- Main Content Area -->
    <main class="col-span-full lg:col-span-1 row-span-1 relative z-10 overflow-hidden flex flex-col bg-transparent">
      <div class="flex-1 overflow-y-auto hide-scrollbar py-6 px-6 lg:px-10 max-w-7xl mx-auto w-full">
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
