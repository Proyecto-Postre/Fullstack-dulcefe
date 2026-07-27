<script setup lang="ts">
import { ref } from 'vue'

// Protección via middleware (admin-only.ts)
definePageMeta({ middleware: 'admin-only' })

// Control de pestañas del panel
const currentTab = ref<'dashboard' | 'products' | 'materials' | 'recipes' | 'orders'>('dashboard')

// 3. Consultas globales a Supabase (Productos e Insumos)
const { data: catalog, refresh: refreshCatalog, pending: pendingCatalog } = await useFetch('/api/products')
const { data: materials, refresh: refreshMaterials, pending: pendingMaterials } = await useFetch('/api/raw-materials')

// 4. Estado compartido para la pestaña de Recetas
const activeProductForRecipe = ref<any>(null)

function goToRecipeTab(product: any) {
  activeProductForRecipe.value = product
  currentTab.value = 'recipes'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 5. Cerrar Sesión
const supabase = useSupabaseClient()
async function handleLogout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] font-inter text-[#2A321B] selection:bg-[#4A5D23] selection:text-[#F4F1E1] relative overflow-hidden">
    
    <!-- Ambient Botanical Background Elements -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-[#4A5D23]/[0.03] -rotate-12" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-[#4A5D23]/[0.03] rotate-45" />
      <Icon name="lucide:leaf" class="absolute top-[30%] left-[10%] w-64 h-64 text-[#4A5D23]/[0.02] rotate-[120deg]" />
      
      <div class="absolute top-0 right-10 w-px h-full bg-gradient-to-b from-transparent via-[#4A5D23]/10 to-transparent"></div>
      <div class="absolute top-0 left-10 w-px h-full bg-gradient-to-b from-transparent via-[#4A5D23]/10 to-transparent"></div>
    </div>

    <!-- Header -->
    <header class="relative z-50 sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#4A5D23]/10 transition-all duration-300 shadow-sm">
      <div class="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 lg:px-12">
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 border border-[#4A5D23]/20 bg-[#F4F1E1] rounded-full flex items-center justify-center text-[#4A5D23] shadow-sm">
            <Icon name="lucide:wheat" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-playfair font-black tracking-tight text-[#2A321B]">Dulce Fe <span class="font-normal text-[#4A5D23] ml-1">| ERP</span></h1>
            <p class="text-[9px] font-bold text-[#4A5D23] uppercase tracking-[0.25em] mt-0.5">Costos & Vitrina</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-6">
          <NuxtLink to="/" class="group flex items-center gap-1.5 text-[13px] font-bold text-[#4A5D23] hover:text-[#2A321B] transition-colors">
            <Icon name="lucide:store" class="w-4 h-4" />
            <span class="border-b border-transparent group-hover:border-[#2A321B] transition-colors">Ver Tienda</span>
          </NuxtLink>
          <button 
            @click="handleLogout"
            class="group flex items-center gap-2 bg-white hover:bg-red-50 text-red-700 text-[13px] px-4 py-2 rounded-xl font-bold transition-all duration-300 border border-red-200 shadow-sm hover:shadow-md"
          >
            <Icon name="lucide:log-out" class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Salir
          </button>
        </div>
      </div>
    </header>

    <!-- Navegación por Pestañas -->
    <div class="relative z-10 max-w-7xl mx-auto pt-8 px-6 lg:px-12">
      <div class="flex space-x-2 border-b border-[#4A5D23]/10 pb-0 overflow-x-auto hide-scrollbar">
        <button 
          @click="currentTab = 'dashboard'"
          :class="[
            'flex items-center gap-2 py-3 px-6 font-bold text-sm rounded-t-[1.5rem] transition-all duration-300 border border-b-0 whitespace-nowrap',
            currentTab === 'dashboard' 
              ? 'bg-white border-[#4A5D23]/20 text-[#2A321B] shadow-sm relative translate-y-[1px]' 
              : 'bg-transparent border-transparent text-[#4A5D23]/60 hover:text-[#4A5D23] hover:bg-white/50'
          ]"
        >
          <Icon name="lucide:layout-dashboard" class="w-4 h-4" />
          Dashboard
        </button>
        <button 
          @click="currentTab = 'products'"
          :class="[
            'flex items-center gap-2 py-3 px-6 font-bold text-sm rounded-t-[1.5rem] transition-all duration-300 border border-b-0 whitespace-nowrap',
            currentTab === 'products' 
              ? 'bg-white border-[#4A5D23]/20 text-[#2A321B] shadow-sm relative translate-y-[1px]' 
              : 'bg-transparent border-transparent text-[#4A5D23]/60 hover:text-[#4A5D23] hover:bg-white/50'
          ]"
        >
          <Icon name="lucide:cake-slice" class="w-4 h-4" />
          Vitrina Comercial
        </button>
        <button 
          @click="currentTab = 'materials'"
          :class="[
            'flex items-center gap-2 py-3 px-6 font-bold text-sm rounded-t-[1.5rem] transition-all duration-300 border border-b-0 whitespace-nowrap',
            currentTab === 'materials' 
              ? 'bg-white border-[#4A5D23]/20 text-[#2A321B] shadow-sm relative translate-y-[1px]' 
              : 'bg-transparent border-transparent text-[#4A5D23]/60 hover:text-[#4A5D23] hover:bg-white/50'
          ]"
        >
          <Icon name="lucide:scale" class="w-4 h-4" />
          Almacén de Insumos
        </button>
        <button 
          @click="currentTab = 'recipes'"
          :class="[
            'flex items-center gap-2 py-3 px-6 font-bold text-sm rounded-t-[1.5rem] transition-all duration-300 border border-b-0 whitespace-nowrap',
            currentTab === 'recipes' 
              ? 'bg-white border-[#4A5D23]/20 text-[#2A321B] shadow-sm relative translate-y-[1px]' 
              : 'bg-transparent border-transparent text-[#4A5D23]/60 hover:text-[#4A5D23] hover:bg-white/50'
          ]"
        >
          <Icon name="lucide:calculator" class="w-4 h-4" />
          Escandallo y Rentabilidad
        </button>
        <button 
          @click="currentTab = 'orders'"
          :class="[
            'flex items-center gap-2 py-3 px-6 font-bold text-sm rounded-t-[1.5rem] transition-all duration-300 border border-b-0 whitespace-nowrap',
            currentTab === 'orders' 
              ? 'bg-white border-[#4A5D23]/20 text-[#2A321B] shadow-sm relative translate-y-[1px]' 
              : 'bg-transparent border-transparent text-[#4A5D23]/60 hover:text-[#4A5D23] hover:bg-white/50'
          ]"
        >
          <Icon name="lucide:clipboard-list" class="w-4 h-4" />
          Gestión de Pedidos
        </button>
      </div>
    </div>

    <main class="relative z-10 max-w-7xl mx-auto py-8 px-6 lg:px-12">
      
      <!-- Componentes de Pestaña -->
      <AdminDashboardTab 
        v-if="currentTab === 'dashboard'" 
        :catalog="catalog"
        :materials="materials"
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

    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500&display=swap');

.font-inter {
  font-family: 'Inter', sans-serif;
}
.font-playfair {
  font-family: 'Playfair Display', serif;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>