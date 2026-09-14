<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useSupabaseClient } from '#imports'

const authStore = useAuthStore()
const supabase = useSupabaseClient()

async function handleLogout() {
  await supabase.auth.signOut()
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
      <div class="w-full flex justify-between items-center py-3.5 px-6 lg:px-8">
        <!-- Logo -->
        <div class="flex items-center space-x-3.5">
          <div class="w-10 h-10 border border-brand-primary/20 bg-brand-cream rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm">
            <Icon name="lucide:wheat" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-playfair font-black tracking-tight text-brand-secondary">
              Dulce Fe <span class="font-normal text-brand-primary ml-1">| ERP</span>
            </h1>
            <p class="text-[9px] font-bold text-brand-primary uppercase tracking-[0.25em] mt-0.5">Costos & Vitrina</p>
          </div>
        </div>
        
        <!-- Acciones: Ver Tienda y Usuario -->
        <div class="flex items-center space-x-4 sm:space-x-6">
          <NuxtLink 
            to="/" 
            class="flex items-center space-x-2 text-xs font-bold text-brand-secondary/80 hover:text-brand-primary bg-brand-cream/60 hover:bg-brand-cream px-3 py-2 rounded-xl transition-all border border-brand-primary/10 shadow-soft-sm"
          >
            <Icon name="lucide:store" class="w-4 h-4 text-brand-primary" />
            <span class="hidden sm:inline">Ver Vitrina</span>
          </NuxtLink>

          <div class="flex items-center space-x-3 border-l border-brand-primary/10 pl-4 sm:pl-6">
            <div class="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs shadow-soft-sm">
              <Icon name="lucide:shield" class="w-4 h-4" />
            </div>
            <div class="hidden md:block text-left">
              <p class="text-xs font-bold text-brand-secondary leading-tight truncate max-w-[160px]">
                {{ authStore.user?.email || 'Administrador' }}
              </p>
              <p class="text-[10px] text-brand-primary font-semibold">Acceso Total</p>
            </div>
            <button 
              @click="handleLogout" 
              class="text-brand-secondary/50 hover:text-status-danger transition-colors p-1.5 rounded-lg hover:bg-red-50"
              title="Cerrar sesión"
            >
              <Icon name="lucide:log-out" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Contenido del Panel -->
    <main class="flex-grow relative z-10 overflow-hidden">
      <slot />
    </main>

    <!-- Portal para Modales de Administración (Teleport Target) -->
    <div id="admin-modal-portal" class="fixed inset-0 z-[100] pointer-events-none empty:hidden"></div>

  </div>
</template>
