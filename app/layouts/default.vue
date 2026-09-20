<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const config = useRuntimeConfig()
const route = useRoute()

const isMobileMenuOpen = ref(false)

// Bloqueo de scroll del body al abrir el menú móvil
watch(isMobileMenuOpen, (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    document.body.classList.add('overflow-hidden', 'overscroll-none')
  } else {
    document.body.classList.remove('overflow-hidden', 'overscroll-none')
  }
})

// Cerrar sidebar al cambiar de ruta automáticamente
watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
})

async function handleLogout() {
  isMobileMenuOpen.value = false
  await authStore.signOut()
  navigateTo('/login')
}

const whatsappCleanUrl = computed(() => {
  const digits = String(config.public?.whatsappNumber || '51998265700').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent('¡Hola Dulce Fe! Deseo realizar una consulta.')}`
})
</script>

<template>
  <div class="min-h-screen bg-brand-cream font-inter text-brand-secondary selection:bg-brand-primary selection:text-brand-cream relative overflow-hidden flex flex-col">
    
    <!-- Drawer Global del Carrito (Instancia Única) -->
    <CartDrawer />
    
    <!-- Elementos Botánicos Ambientales de Fondo -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-brand-primary/[0.02] -rotate-12 pointer-events-none" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-brand-primary/[0.02] rotate-45 pointer-events-none" />
    </div>

    <!-- Header Sticky Unificado Reutilizable -->
    <AppHeader @open-mobile-menu="isMobileMenuOpen = true" />

    <!-- Contenido Central de la Vista con flex-grow para empujar footer al fondo -->
    <main class="flex-grow z-10 flex flex-col">
      <slot />
    </main>

    <!-- Sidebar Móvil de Navegación (Drawer exclusivo para móviles < md) -->
    <Teleport to="body">
      <Transition name="drawer-fade">
        <div 
          v-if="isMobileMenuOpen" 
          class="fixed inset-0 z-[9999] flex justify-end md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-[#2A321B]/50 backdrop-blur-sm transition-opacity touch-none"
            @click="isMobileMenuOpen = false"
            @touchmove.prevent
          ></div>

          <!-- Sidebar Panel -->
          <aside 
            class="relative w-[85%] max-w-xs bg-brand-cream h-full h-[100dvh] max-h-[100dvh] shadow-2xl border-l border-brand-primary/20 flex flex-col z-10 animate-slide-in p-6 overscroll-contain overflow-hidden"
            @click.stop
          >
            <!-- Cabecera del Sidebar -->
            <div class="flex items-center justify-between pb-5 border-b border-brand-primary/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 border border-brand-primary/20 bg-surface rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm">
                  <Icon name="lucide:wheat" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-xl font-playfair font-black text-brand-secondary">Dulce Fe</span>
                  <p class="text-[9px] font-bold text-brand-primary uppercase tracking-[0.2em]">Pastelería Fina</p>
                </div>
              </div>
              <button 
                type="button"
                @click="isMobileMenuOpen = false"
                class="w-9 h-9 rounded-full bg-surface border border-brand-primary/15 flex items-center justify-center text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                aria-label="Cerrar menú"
              >
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <!-- Navegación Principal del Sidebar -->
            <div class="flex-1 overflow-y-auto py-5 space-y-2">
              <NuxtLink 
                to="/" 
                @click="isMobileMenuOpen = false"
                active-class="bg-surface text-brand-primary font-black border-brand-primary/20 shadow-soft-sm"
                class="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm text-brand-secondary hover:bg-surface/80 border border-transparent transition-all"
              >
                <Icon name="lucide:home" class="w-5 h-5 text-brand-primary" />
                <span>Inicio</span>
              </NuxtLink>

              <NuxtLink 
                to="/menu" 
                @click="isMobileMenuOpen = false"
                active-class="bg-surface text-brand-primary font-black border-brand-primary/20 shadow-soft-sm"
                class="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm text-brand-secondary hover:bg-surface/80 border border-transparent transition-all"
              >
                <Icon name="lucide:book-open" class="w-5 h-5 text-brand-primary" />
                <span>Carta & Menú</span>
              </NuxtLink>

              <NuxtLink 
                to="/perfil?tab=pedidos" 
                @click="isMobileMenuOpen = false"
                active-class="bg-surface text-brand-primary font-black border-brand-primary/20 shadow-soft-sm"
                class="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm text-brand-secondary hover:bg-surface/80 border border-transparent transition-all"
              >
                <Icon name="lucide:shopping-bag" class="w-5 h-5 text-brand-primary" />
                <span>Mis Pedidos</span>
              </NuxtLink>

              <a 
                :href="whatsappCleanUrl" 
                target="_blank"
                rel="noopener noreferrer"
                @click="isMobileMenuOpen = false"
                class="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm text-brand-secondary hover:bg-surface/80 border border-transparent transition-all cursor-pointer"
              >
                <Icon name="lucide:message-circle" class="w-5 h-5 text-emerald-600" />
                <span>Atención WhatsApp</span>
              </a>

              <!-- Opción Destacada de Panel Admin (Solo Administradores) -->
              <div v-if="authStore.isAdmin" class="pt-4 mt-4 border-t border-brand-primary/10">
                <p class="text-[10px] font-black uppercase tracking-wider text-brand-primary/60 px-4 mb-2">Administración</p>
                <NuxtLink 
                  to="/admin" 
                  @click="isMobileMenuOpen = false"
                  class="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm bg-brand-secondary text-white hover:bg-brand-primary shadow-soft-sm transition-all"
                >
                  <Icon name="lucide:shield-check" class="w-5 h-5 text-status-success shrink-0" />
                  <div class="min-w-0">
                    <span class="block text-sm font-black">Panel de Administración</span>
                    <span class="block text-[10px] text-brand-cream/70 font-normal">Vitrina, insumos y pedidos</span>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Footer del Sidebar Móvil -->
            <div class="pt-4 border-t border-brand-primary/10 space-y-3">
              <ClientOnly>
                <template v-if="authStore.isLoggedIn">
                  <NuxtLink 
                    to="/perfil?tab=personal" 
                    @click="isMobileMenuOpen = false"
                    class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-brand-primary/15 text-xs font-bold text-brand-secondary"
                  >
                    <Icon name="lucide:user" class="w-4 h-4 text-brand-primary" />
                    <span class="truncate">{{ authStore.profile?.full_name || authStore.user?.user_metadata?.full_name || authStore.user?.email || 'Mi Perfil' }}</span>
                  </NuxtLink>
                  <button 
                    @click="handleLogout" 
                    type="button"
                    class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-status-danger bg-red-50/60 hover:bg-red-500 hover:text-white border border-red-200/60 hover:border-red-500 shadow-soft-sm hover:shadow-md active:scale-98 transition-all duration-200 cursor-pointer"
                    aria-label="Cerrar sesión"
                  >
                    <Icon name="lucide:log-out" class="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </template>
                <template v-else>
                  <NuxtLink 
                    to="/login" 
                    @click="isMobileMenuOpen = false"
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-soft-sm hover:bg-brand-secondary transition-all"
                  >
                    <Icon name="lucide:user" class="w-4 h-4" />
                    <span>Iniciar Sesión</span>
                  </NuxtLink>
                </template>
                <template #fallback>
                  <div class="h-10 w-full bg-brand-primary/10 rounded-xl animate-pulse"></div>
                </template>
              </ClientOnly>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer Reutilizable Global -->
    <AppFooter />

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
