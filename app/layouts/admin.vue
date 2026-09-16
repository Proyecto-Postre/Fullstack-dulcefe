<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useAdminTab, useAdminMobileMenu, type AdminTab } from '~/composables/admin/useAdminNavState'

const authStore = useAuthStore()
const currentTab = useAdminTab()
const isMobileAdminMenuOpen = useAdminMobileMenu()

const adminModules: { id: AdminTab; label: string; icon: string; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard', desc: 'Resumen y alertas de stock' },
  { id: 'products', label: 'Vitrina Comercial', icon: 'lucide:cake-slice', desc: 'Productos, precios y estado' },
  { id: 'materials', label: 'Almacén de Insumos', icon: 'lucide:scale', desc: 'Control de materias primas' },
  { id: 'recipes', label: 'Escandallo', icon: 'lucide:calculator', desc: 'Fichas técnicas y costos' },
  { id: 'orders', label: 'Gestión de Pedidos', icon: 'lucide:clipboard-list', desc: 'Kanban comercial y comprobantes' }
]

function selectModule(tab: AdminTab) {
  currentTab.value = tab
  isMobileAdminMenuOpen.value = false
  const route = useRoute()
  if (route.path !== '/admin') {
    navigateTo('/admin')
  }
}

async function handleLogout() {
  isMobileAdminMenuOpen.value = false
  await authStore.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="h-screen w-screen bg-brand-cream font-inter text-brand-secondary selection:bg-brand-primary selection:text-brand-cream relative overflow-hidden flex flex-col">
    
    <!-- Elementos Botánicos Ambientales de Fondo -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-brand-primary/[0.03] -rotate-12 pointer-events-none" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-brand-primary/[0.03] rotate-45 pointer-events-none" />
      <Icon name="lucide:leaf" class="absolute top-[30%] left-[10%] w-64 h-64 text-brand-primary/[0.02] rotate-[120deg] pointer-events-none" />
    </div>

    <!-- Header Administrativo ERP -->
    <header class="relative z-50 bg-surface/90 backdrop-blur-md border-b border-brand-primary/10 transition-all duration-300 shadow-soft-sm shrink-0">
      <div class="w-full flex justify-between items-center py-3.5 px-5 sm:px-6 lg:px-8">
        <!-- Logo -->
        <div class="flex items-center space-x-3 sm:space-x-3.5">
          <div class="w-9 h-9 sm:w-10 sm:h-10 border border-brand-primary/20 bg-brand-cream rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm shrink-0">
            <Icon name="lucide:wheat" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-lg sm:text-xl font-playfair font-black tracking-tight text-brand-secondary leading-tight">
              Dulce Fe <span class="font-normal text-brand-primary ml-0.5 sm:ml-1 text-sm sm:text-base">| ERP</span>
            </h1>
            <p class="text-[8px] sm:text-[9px] font-bold text-brand-primary uppercase tracking-[0.25em] mt-0.5">Costos & Vitrina</p>
          </div>
        </div>
        
        <!-- Acciones: Desktop (Completo) y Mobile (Tienda + Hamburguesa) -->
        <div class="flex items-center space-x-2.5 sm:space-x-5">
          <NuxtLink 
            to="/" 
            class="flex items-center space-x-1.5 sm:space-x-2 text-xs font-bold text-brand-secondary/80 hover:text-brand-primary bg-brand-cream/60 hover:bg-brand-cream px-3 py-2 rounded-xl transition-all border border-brand-primary/10 shadow-soft-sm"
            title="Ir a la vitrina de la tienda"
          >
            <Icon name="lucide:store" class="w-4 h-4 text-brand-primary" />
            <span class="hidden sm:inline">Ver Vitrina</span>
          </NuxtLink>

          <!-- Información de Administrador (Solo Desktop lg) -->
          <div class="hidden lg:flex items-center space-x-3 border-l border-brand-primary/10 pl-5">
            <div class="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs shadow-soft-sm">
              <Icon name="lucide:shield" class="w-4 h-4" />
            </div>
            <div class="text-left">
              <p class="text-xs font-bold text-brand-secondary leading-tight truncate max-w-[160px]">
                {{ authStore.user?.email || 'Administrador' }}
              </p>
              <p class="text-[10px] text-brand-primary font-semibold">Acceso Total</p>
            </div>
            <button 
              @click="handleLogout" 
              class="text-brand-secondary/50 hover:text-status-danger transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
              title="Cerrar sesión"
            >
              <Icon name="lucide:log-out" class="w-4 h-4" />
            </button>
          </div>

          <!-- Botón Menú Hamburguesa (Exclusivo Mobile / Tablet < lg) -->
          <button
            type="button"
            @click="isMobileAdminMenuOpen = true"
            class="lg:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-brand-primary/20 bg-brand-cream text-brand-primary shadow-soft-sm active:scale-95 cursor-pointer transition-all"
            aria-label="Abrir menú de módulos"
          >
            <Icon name="lucide:menu" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido del Panel -->
    <main class="flex-grow relative z-10 overflow-hidden">
      <slot />
    </main>

    <!-- Sidebar Móvil de Administración (Drawer exclusivo para móviles y tablets < lg) -->
    <Teleport to="body">
      <Transition name="drawer-fade">
        <div 
          v-if="isMobileAdminMenuOpen" 
          class="fixed inset-0 z-[9999] flex justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-[#2A321B]/50 backdrop-blur-sm transition-opacity"
            @click="isMobileAdminMenuOpen = false"
          ></div>

          <!-- Drawer Panel -->
          <aside 
            class="relative w-[85%] max-w-xs bg-brand-cream h-full shadow-2xl border-l border-brand-primary/20 flex flex-col z-10 animate-slide-in p-6"
            @click.stop
          >
            <!-- Cabecera del Sidebar -->
            <div class="flex items-center justify-between pb-5 border-b border-brand-primary/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 border border-brand-primary/20 bg-surface rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm">
                  <Icon name="lucide:shield" class="w-5 h-5" />
                </div>
                <div>
                  <h2 class="text-lg font-playfair font-black text-brand-secondary leading-tight">Módulos ERP</h2>
                  <p class="text-[9px] font-bold text-brand-primary uppercase tracking-[0.2em]">Panel Administrativo</p>
                </div>
              </div>
              <button 
                type="button"
                @click="isMobileAdminMenuOpen = false"
                class="w-9 h-9 rounded-full bg-surface border border-brand-primary/15 flex items-center justify-center text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                aria-label="Cerrar menú"
              >
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <!-- Lista de Módulos con Estado Activo -->
            <div class="flex-1 overflow-y-auto py-5 space-y-2">
              <button
                v-for="mod in adminModules"
                :key="mod.id"
                type="button"
                @click="selectModule(mod.id)"
                :class="[
                  'w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-left transition-all border cursor-pointer',
                  currentTab === mod.id
                    ? 'bg-surface text-brand-primary border-brand-primary/25 shadow-soft-sm scale-[1.01]'
                    : 'bg-transparent text-brand-secondary border-transparent hover:bg-surface/60'
                ]"
              >
                <Icon :name="mod.icon" class="w-5 h-5 shrink-0 text-brand-primary" />
                <div class="min-w-0">
                  <span class="block text-sm leading-snug">{{ mod.label }}</span>
                  <span class="block text-[10px] text-brand-primary/60 font-medium truncate">{{ mod.desc }}</span>
                </div>
              </button>

              <!-- Módulo Especial KDS Cocina -->
              <div class="pt-3 mt-3 border-t border-brand-primary/10">
                <NuxtLink
                  to="/admin/kds"
                  @click="isMobileAdminMenuOpen = false"
                  class="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-300/40 shadow-soft-sm transition-all"
                >
                  <Icon name="lucide:chef-hat" class="w-5 h-5 text-amber-600 shrink-0" />
                  <div class="min-w-0">
                    <span class="block text-sm leading-snug font-black">KDS Cocina / Taller</span>
                    <span class="block text-[10px] text-amber-700/80 font-medium">Comandas y horneado</span>
                  </div>
                  <Icon name="lucide:arrow-right" class="w-4 h-4 ml-auto text-amber-600" />
                </NuxtLink>
              </div>
            </div>

            <!-- Footer del Sidebar Admin -->
            <div class="pt-4 border-t border-brand-primary/10 space-y-3">
              <div class="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface border border-brand-primary/10 text-xs">
                <div class="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0">
                  <Icon name="lucide:user" class="w-3.5 h-3.5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-bold text-brand-secondary truncate text-[11px]">{{ authStore.user?.email || 'Admin' }}</p>
                  <p class="text-[9px] text-brand-primary font-semibold uppercase tracking-wider">Acceso Total</p>
                </div>
              </div>
              <button 
                @click="handleLogout" 
                type="button"
                class="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-status-danger hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Icon name="lucide:log-out" class="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>

    <!-- Portal para Modales de Administración (Teleport Target) -->
    <div id="admin-modal-portal" class="fixed inset-0 z-[100] pointer-events-none empty:hidden"></div>

  </div>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease-out;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.animate-slide-in {
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
