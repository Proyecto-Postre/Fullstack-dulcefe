<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

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
  <div class="h-screen w-screen bg-[#F4F1E1] font-inter text-[#2A321B] selection:bg-[#4A5D23] selection:text-[#F4F1E1] relative overflow-hidden grid grid-cols-1 lg:grid-cols-[280px_1fr] grid-rows-[auto_auto_1fr] lg:grid-rows-[auto_1fr]">
    
    <!-- Ambient Botanical Background Elements -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-[#4A5D23]/[0.03] -rotate-12" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-[#4A5D23]/[0.03] rotate-45" />
      <Icon name="lucide:leaf" class="absolute top-[30%] left-[10%] w-64 h-64 text-[#4A5D23]/[0.02] rotate-[120deg]" />
    </div>

    <!-- Header -->
    <header class="col-span-full row-span-1 relative z-50 bg-white/90 backdrop-blur-md border-b border-[#4A5D23]/10 transition-all duration-300 shadow-sm">
      <div class="w-full flex justify-between items-center py-4 px-6 lg:px-8">
        <!-- Logo (Alineado con el sidebar) -->
        <div class="flex items-center space-x-4 lg:w-[248px]">
          <div class="w-10 h-10 border border-[#4A5D23]/20 bg-[#F4F1E1] rounded-full flex items-center justify-center text-[#4A5D23] shadow-sm">
            <Icon name="lucide:wheat" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-playfair font-black tracking-tight text-[#2A321B]">Dulce Fe <span class="font-normal text-[#4A5D23] ml-1">| ERP</span></h1>
            <p class="text-[9px] font-bold text-[#4A5D23] uppercase tracking-[0.25em] mt-0.5">Costos & Vitrina</p>
          </div>
        </div>
        
        <!-- User Info & Actions -->
        <div class="flex items-center space-x-6">
          <NuxtLink to="/" class="group flex items-center gap-1.5 text-[13px] font-bold text-[#4A5D23] hover:text-[#2A321B] transition-colors border-r border-[#4A5D23]/10 pr-6">
            <Icon name="lucide:store" class="w-4 h-4" />
            <span class="border-b border-transparent group-hover:border-[#2A321B] transition-colors">Ver Tienda</span>
          </NuxtLink>
          
          <!-- User Info -->
          <div class="hidden md:flex items-center gap-3">
            <div class="text-right">
              <p class="text-sm font-bold text-[#2A321B]">{{ authStore.user?.user_metadata?.full_name || 'Administrador' }}</p>
              <p class="text-xs text-[#4A5D23] font-medium">{{ authStore.user?.email }}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-[#F4F1E1] border border-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23] shadow-sm">
              <Icon name="lucide:user" class="w-5 h-5" />
            </div>
          </div>
          
          <!-- Mobile Logout -->
          <button 
            @click="handleLogout"
            class="lg:hidden group flex items-center justify-center w-10 h-10 bg-white hover:bg-red-50 text-red-700 rounded-full transition-all duration-300 border border-red-200 shadow-sm hover:shadow-md"
            title="Cerrar Sesión"
          >
            <Icon name="lucide:log-out" class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>

    <!-- Sidebar (Desktop) -->
    <aside class="hidden lg:flex flex-col col-span-1 row-span-1 bg-white border-r border-[#4A5D23]/10 relative z-20 overflow-hidden">
      <!-- Decorative Background -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F4F1E1] to-transparent rounded-bl-full"></div>
        <Icon name="lucide:leaf" class="absolute -bottom-10 -left-10 w-48 h-48 text-[#4A5D23]/[0.02] -rotate-45" />
      </div>

      <div class="p-6 flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <p class="text-[10px] font-black text-[#4A5D23]/60 uppercase tracking-[0.2em] mb-4 px-2">Menú Principal</p>
        <button 
          @click="currentTab = 'dashboard'"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group',
            currentTab === 'dashboard' ? 'bg-[#F4F1E1] text-[#4A5D23] border-[#4A5D23]/20 shadow-sm' : 'bg-transparent text-[#2A321B] border-transparent hover:bg-[#F4F1E1]/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-[#4A5D23] transition-transform duration-300', currentTab === 'dashboard' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:layout-dashboard" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'dashboard' ? 'scale-110' : 'group-hover:scale-110']" />
          Dashboard
        </button>
        <button 
          @click="currentTab = 'products'"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group',
            currentTab === 'products' ? 'bg-[#F4F1E1] text-[#4A5D23] border-[#4A5D23]/20 shadow-sm' : 'bg-transparent text-[#2A321B] border-transparent hover:bg-[#F4F1E1]/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-[#4A5D23] transition-transform duration-300', currentTab === 'products' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:cake-slice" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'products' ? 'scale-110' : 'group-hover:scale-110']" />
          Vitrina Comercial
        </button>
        <button 
          @click="currentTab = 'materials'"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group',
            currentTab === 'materials' ? 'bg-[#F4F1E1] text-[#4A5D23] border-[#4A5D23]/20 shadow-sm' : 'bg-transparent text-[#2A321B] border-transparent hover:bg-[#F4F1E1]/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-[#4A5D23] transition-transform duration-300', currentTab === 'materials' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:scale" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'materials' ? 'scale-110' : 'group-hover:scale-110']" />
          Almacén de Insumos
        </button>
        <button 
          @click="currentTab = 'recipes'"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group',
            currentTab === 'recipes' ? 'bg-[#F4F1E1] text-[#4A5D23] border-[#4A5D23]/20 shadow-sm' : 'bg-transparent text-[#2A321B] border-transparent hover:bg-[#F4F1E1]/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-[#4A5D23] transition-transform duration-300', currentTab === 'recipes' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:calculator" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'recipes' ? 'scale-110' : 'group-hover:scale-110']" />
          Escandallo
        </button>
        <button 
          @click="currentTab = 'orders'"
          :class="[
            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left w-full border relative overflow-hidden group',
            currentTab === 'orders' ? 'bg-[#F4F1E1] text-[#4A5D23] border-[#4A5D23]/20 shadow-sm' : 'bg-transparent text-[#2A321B] border-transparent hover:bg-[#F4F1E1]/50'
          ]"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 bg-[#4A5D23] transition-transform duration-300', currentTab === 'orders' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50']"></div>
          <Icon name="lucide:clipboard-list" :class="['w-5 h-5 transition-transform duration-300', currentTab === 'orders' ? 'scale-110' : 'group-hover:scale-110']" />
          Gestión de Pedidos
        </button>
      </div>
      
      <!-- Sidebar Footer -->
      <div class="p-6 border-t border-[#4A5D23]/10 bg-white relative z-10">
        <button 
          @click="handleLogout"
          class="group flex items-center justify-center gap-2 w-full bg-white hover:bg-red-50 text-red-700 px-4 py-3 rounded-2xl font-bold transition-all duration-300 border border-red-200 shadow-sm hover:shadow-md"
        >
          <Icon name="lucide:log-out" class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Navegación Móvil (Horizontal) -->
    <div class="lg:hidden col-span-full row-span-1 relative z-20 bg-white border-b border-[#4A5D23]/10">
      <div class="flex space-x-2 p-4 overflow-x-auto hide-scrollbar">
        <button 
          @click="currentTab = 'dashboard'"
          :class="[
            'flex items-center gap-2 py-2 px-4 font-bold text-sm rounded-xl transition-all duration-300 border whitespace-nowrap',
            currentTab === 'dashboard' 
              ? 'bg-[#F4F1E1] border-[#4A5D23]/20 text-[#4A5D23] shadow-sm' 
              : 'bg-transparent border-transparent text-[#2A321B] hover:bg-[#F4F1E1]/50'
          ]"
        >
          <Icon name="lucide:layout-dashboard" class="w-4 h-4" />
          Dashboard
        </button>
        <button 
          @click="currentTab = 'products'"
          :class="[
            'flex items-center gap-2 py-2 px-4 font-bold text-sm rounded-xl transition-all duration-300 border whitespace-nowrap',
            currentTab === 'products' 
              ? 'bg-[#F4F1E1] border-[#4A5D23]/20 text-[#4A5D23] shadow-sm' 
              : 'bg-transparent border-transparent text-[#2A321B] hover:bg-[#F4F1E1]/50'
          ]"
        >
          <Icon name="lucide:cake-slice" class="w-4 h-4" />
          Vitrina
        </button>
        <button 
          @click="currentTab = 'materials'"
          :class="[
            'flex items-center gap-2 py-2 px-4 font-bold text-sm rounded-xl transition-all duration-300 border whitespace-nowrap',
            currentTab === 'materials' 
              ? 'bg-[#F4F1E1] border-[#4A5D23]/20 text-[#4A5D23] shadow-sm' 
              : 'bg-transparent border-transparent text-[#2A321B] hover:bg-[#F4F1E1]/50'
          ]"
        >
          <Icon name="lucide:scale" class="w-4 h-4" />
          Almacén
        </button>
        <button 
          @click="currentTab = 'recipes'"
          :class="[
            'flex items-center gap-2 py-2 px-4 font-bold text-sm rounded-xl transition-all duration-300 border whitespace-nowrap',
            currentTab === 'recipes' 
              ? 'bg-[#F4F1E1] border-[#4A5D23]/20 text-[#4A5D23] shadow-sm' 
              : 'bg-transparent border-transparent text-[#2A321B] hover:bg-[#F4F1E1]/50'
          ]"
        >
          <Icon name="lucide:calculator" class="w-4 h-4" />
          Escandallo
        </button>
        <button 
          @click="currentTab = 'orders'"
          :class="[
            'flex items-center gap-2 py-2 px-4 font-bold text-sm rounded-xl transition-all duration-300 border whitespace-nowrap',
            currentTab === 'orders' 
              ? 'bg-[#F4F1E1] border-[#4A5D23]/20 text-[#4A5D23] shadow-sm' 
              : 'bg-transparent border-transparent text-[#2A321B] hover:bg-[#F4F1E1]/50'
          ]"
        >
          <Icon name="lucide:clipboard-list" class="w-4 h-4" />
          Pedidos
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <main class="col-span-full lg:col-span-1 row-span-1 relative z-10 overflow-y-auto bg-transparent custom-scrollbar">
      <div class="max-w-7xl mx-auto py-8 px-6 lg:px-12">
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

      </div>
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

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(74, 93, 35, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(74, 93, 35, 0.4);
}
</style>